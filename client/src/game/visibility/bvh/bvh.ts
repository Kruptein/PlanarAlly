import { partition } from "@/core/utils";
import { GlobalPoint, Ray } from "@/game/geom";
import { layerManager } from "@/game/layers/manager";
import { BoundingRect } from "@/game/shapes/boundingrect";
import { g2lx, g2ly, g2lz } from "@/game/units";
import { BoundingNode, InteriorNode, LeafNode } from "@/game/visibility/bvh/node";

interface BuildInfo {
    index: number;
    bbox: BoundingRect;
    center: BoundingRect;
}
interface LinearBHVNode {
    bbox: BoundingRect;
    nPrimitives: number;
}
interface LinearLeafNode extends LinearBHVNode {
    primitivesOffset: number;
}
interface LinearInternalNode extends LinearBHVNode {
    secondChildOffset: number;
    dimension: number;
}

export class BoundingVolume {
    totalNodes = 0;
    buildData: BuildInfo[] = [];
    shapes: string[];
    orderedPrims: string[] = [];
    root: BoundingNode | null;
    nodes: LinearBHVNode[] = [];

    offset = 0;

    constructor(shapes: string[]) {
        this.shapes = shapes;
        if (this.shapes.length === 0) {
            this.root = null;
            this.nodes = [];
            return;
        }
        for (let i = 0; i < shapes.length; i++) {
            const shape = layerManager.UUIDMap.get(shapes[i])!;
            this.buildData.push({
                index: i,
                bbox: shape.getBoundingBox(),
                center: new BoundingRect(shape.center(), 0, 0),
            });
        }
        this.root = this.recursiveBuild(0, shapes.length);
        this.compact();
    }

    draw(): void {
        const ctx = layerManager.getLayer("draw")!.ctx;
        for (const node of this.nodes) {
            const b = node.bbox;
            ctx.strokeRect(g2lx(b.topLeft.x), g2ly(b.topLeft.y), g2lz(b.w), g2lz(b.h));
        }
    }

    recursiveBuild(start: number, end: number): BoundingNode {
        this.totalNodes++;
        let bbox = this.buildData[start].bbox;
        for (let i = start + 1; i < end; i++) bbox = bbox.union(this.buildData[i].bbox);
        const nPrimitives = end - start;
        if (nPrimitives === 1) {
            return this.createLeaf(start, end, nPrimitives, bbox);
        } else {
            let centroidBbox = this.buildData[start].center;
            for (let i = start; i < end; i++) centroidBbox = centroidBbox.union(this.buildData[i].center);
            const dimension = centroidBbox.getMaxExtent();
            if (centroidBbox.botRight.get(dimension) === centroidBbox.topLeft.get(dimension)) {
                return this.createLeaf(start, end, nPrimitives, bbox);
            }
            // Use shitty Middle thingy until an introselect js algo is added
            const pMid = 0.5 * (centroidBbox.topLeft.get(dimension) + centroidBbox.botRight.get(dimension));
            const partitionedData = partition(
                this.buildData.slice(start, end),
                (n: BuildInfo) => n.center.center().get(dimension) < pMid,
            );
            const flattened = (<BuildInfo[]>[]).concat.apply([], partitionedData);
            if (partitionedData[0].length === 0 || partitionedData[1].length === 0) console.log("EMPTY");
            this.buildData.splice(start, flattened.length, ...flattened);
            const mid = partitionedData[0].length + start;
            return new InteriorNode(dimension, this.recursiveBuild(start, mid), this.recursiveBuild(mid, end));
        }
    }

    intersect(
        ray: Ray<GlobalPoint>,
        stopOnFirstHit?: boolean,
    ): { hit: boolean; intersect: GlobalPoint; tMin: number; tMax: number } {
        if (this.nodes.length === 0) return { hit: false, intersect: ray.get(0), tMin: 0, tMax: ray.tMax };
        if (stopOnFirstHit === undefined) stopOnFirstHit = false;
        // Initialize return values
        let hit = false;
        let tMin = 0;
        let tMax = ray.tMax;

        // Initialize work variables
        let todoOffset = 0;
        let nodeNum = 0;
        const todo: number[] = [];

        // Precalculate intersection vectors
        const invDir = ray.direction.inverse();
        const dirIsNegative = [invDir.x < 0, invDir.y < 0];

        while (true) {
            const node = this.nodes[nodeNum];

            const i = node.bbox.intersectP(ray, invDir, dirIsNegative);
            if (i.hit) {
                if (node.nPrimitives > 0) {
                    // TODO: nPrimitives is currently always 1 , this could be generalised
                    // for (let i=0; i < node.nPrimitives; i++) {
                    //     if (this.shapes[(<LinearLeafNode>node).primitivesOffset + i])
                    // }
                    hit = true;
                    tMin = ray.tMax = i.min;
                    tMax = i.max;
                    if (todoOffset === 0 || stopOnFirstHit) break;
                    nodeNum = todo[--todoOffset];
                } else {
                    if (dirIsNegative[(<LinearInternalNode>node).dimension]) {
                        todo[todoOffset++] = nodeNum + 1;
                        nodeNum = (<LinearInternalNode>node).secondChildOffset;
                    } else {
                        todo[todoOffset++] = (<LinearInternalNode>node).secondChildOffset;
                        nodeNum++;
                    }
                }
            } else {
                if (todoOffset === 0) break;
                nodeNum = todo[--todoOffset];
            }
        }
        return { hit, intersect: ray.get(tMin), tMin, tMax };
    }

    private compact(): void {
        this.offset = 0;
        if (this.root !== null) this.flatten(this.root);
    }

    private flatten(node: BoundingNode): number {
        const index = this.offset;
        const myOffset = this.offset++;
        if (node.nPrimitives === 0) {
            this.flatten(node.children[0]);
            const secondOffset = this.flatten(node.children[1]);
            const linearNode: LinearInternalNode = {
                bbox: node.bbox,
                dimension: (<InteriorNode>node).dimension,
                nPrimitives: 0,
                secondChildOffset: secondOffset,
            };
            this.nodes[index] = linearNode;
        } else {
            const leafNode: LinearLeafNode = {
                bbox: node.bbox,
                primitivesOffset: (<LeafNode>node).firstPrimOffset,
                nPrimitives: node.nPrimitives,
            };
            this.nodes[index] = leafNode;
        }
        return myOffset;
    }

    private createLeaf(start: number, end: number, nPrimitives: number, bbox: BoundingRect): LeafNode {
        const size = this.orderedPrims.length;
        for (let i = start; i < end; i++) this.orderedPrims.push(this.shapes[this.buildData[i].index]);
        return new LeafNode(size, nPrimitives, bbox);
    }
}

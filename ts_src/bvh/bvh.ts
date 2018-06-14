import BoundingRect from "../shapes/boundingrect";
import gameManager from "../planarally";
import { LeafNode, InteriorNode, BoundingNode } from "./node";
import { partition } from "../utils";
import { Vector, GlobalPoint, Point } from "../geom";
import { g2lx, g2ly, g2lz } from "../units";

type buildInfo = {index: number, bbox: BoundingRect, center: BoundingRect};
interface LinearBHVNode {bbox: BoundingRect, nPrimitives: number};
interface LinearLeafNode extends LinearBHVNode {primitivesOffset: number};
interface LinearInternalNode extends LinearBHVNode {secondChildOffset: number, dimension: number};

class BoundingVolume {

    totalNodes = 0;
    buildData: buildInfo[] = [];
    shapes: string[];
    orderedPrims: string[] = [];
    root: BoundingNode | null;
    nodes: LinearBHVNode[] = [];

    offset = 0;

    constructor(shapes: string[]) {
        this.shapes = shapes;
        if (this.shapes.length == 0) {
            this.root = null;
            this.nodes = [];
            return;
        }
        for (let i=0; i < shapes.length; i++) {
            const shape = gameManager.layerManager.UUIDMap.get(shapes[i])!;
            this.buildData.push({index: i, bbox: shape.getBoundingBox(), center: new BoundingRect(shape.center(), 0, 0)});
        }
        this.root = this.recursiveBuild(0, shapes.length);
        this.compact();
    }

    draw() {
        const ctx = gameManager.layerManager.getLayer("draw")!.ctx;
        for (let i=0; i < this.nodes.length; i++){
            const b = this.nodes[i].bbox;
            ctx.strokeRect(g2lx(b.topLeft.x), g2ly(b.topLeft.y), g2lz(b.w), g2lz(b.h));
        }
    }

    recursiveBuild(start: number, end: number): BoundingNode {
        this.totalNodes++;
        let bbox = this.buildData[start].bbox;
        for (let i=start + 1; i < end; i++)
            bbox = bbox.union(this.buildData[i].bbox);
        const nPrimitives = end - start;
        if (nPrimitives == 1) {
            return this.createLeaf(start, end, nPrimitives, bbox);
        } else {
            let centroidBbox = this.buildData[start].center;
            for (let i=start; i < end; i++)
                centroidBbox = centroidBbox.union(this.buildData[i].center);
            const dimension = centroidBbox.getMaxExtent();
            if (centroidBbox.botRight.get(dimension) == centroidBbox.topLeft.get(dimension)) {
                return this.createLeaf(start, end, nPrimitives, bbox);
            }
            // Use shitty Middle thingy until an introselect js algo is added
            const pMid = 0.5 * (centroidBbox.topLeft.get(dimension) + centroidBbox.botRight.get(dimension));
            const partitionedData = partition(this.buildData.slice(start, end), (n: buildInfo) => n.center.center().get(dimension) < pMid);
            const flattened = [].concat.apply([], partitionedData);
            if (partitionedData[0].length == 0 || partitionedData[1].length == 0) console.log("EMPTY");
            this.buildData.splice(start, flattened.length, ...(flattened));
            const mid = partitionedData[0].length + start;
            return new InteriorNode(dimension, this.recursiveBuild(start, mid), this.recursiveBuild(mid, end));
            // // Use surface area heuristic
            // if (nPrimitives <= 2) {
            //     const mid = (start + end) / 2;

            // }
        }
    }

    intersect(start: GlobalPoint, end: GlobalPoint, skipZero: boolean, firstshit: boolean, count?: boolean) {
        const ctx = gameManager.layerManager.getLayer("draw")!.ctx;
        let hit = false;
        let todoOffset = 0;
        let nodeNum = 0;
        const ray = Vector.fromPoints(start, end);
        const invDir = ray.inverse();
        const dirIsNegative = [invDir.direction.x < 0, invDir.direction.y < 0];
        const todo: number[] = [];
        let intersect = null;
        let n;
        while (true) {
            const node = this.nodes[nodeNum];
            const b = node.bbox;
            if (count)
                ctx.strokeRect(g2lx(b.topLeft.x), g2ly(b.topLeft.y), g2lz(b.w), g2lz(b.h));
            // const inBbox = node.bbox.contains(start) && node.bbox.contains(end);
            // const intersectResult = node.bbox.getIntersectWithLine({start, end}, skipZero);
            // if (inBbox || intersectResult.intersect !== null) {
            const i = this.intersectP(b, ray, invDir, dirIsNegative);
            if (i.hit) {
                if (node.nPrimitives > 0) {
                    // TODO: nPrimitives is currently always 1 , this could be generalised 
                    // for (let i=0; i < node.nPrimitives; i++) {
                    //     if (this.shapes[(<LinearLeafNode>node).primitivesOffset + i])
                    // }
                    hit = true;
                    // const intersectResult = node.bbox.getIntersectWithLine({start, end}, skipZero)
                    // intersect = intersectResult.intersect!;
                    intersect = new GlobalPoint(ray.origin!.x + i.min * ray.direction.x, ray.origin!.y + i.min * ray.direction.y);
                    ray.maxT = i.min;
                    n = node;
                    if (todoOffset == 0 || firstshit) break;
                    nodeNum = todo[--todoOffset];
                } else {
                    if(dirIsNegative[(<LinearInternalNode>node).dimension]){
                        todo[todoOffset++] = nodeNum + 1;
                        nodeNum = (<LinearInternalNode>node).secondChildOffset;
                    } else {
                        todo[todoOffset++] = (<LinearInternalNode>node).secondChildOffset;
                        nodeNum++;
                    }
                }
            } else {
                if (todoOffset == 0) break;
                nodeNum = todo[--todoOffset];
            }
        }
        return {hit: hit, intersect: intersect, node: n};
    }

    private intersectP(bounds: BoundingRect, ray: Vector<Point>, invDir: Vector<Point>, dirIsNeg: boolean[]) {
        let txmin = invDir.direction.x * (bounds.getDiagCorner(dirIsNeg[0]).x - ray.origin!.x);
        let txmax = invDir.direction.x * (bounds.getDiagCorner(!dirIsNeg[0]).x - ray.origin!.x);
        const tymin = invDir.direction.y * (bounds.getDiagCorner(dirIsNeg[1]).y - ray.origin!.y);
        const tymax = invDir.direction.y * (bounds.getDiagCorner(!dirIsNeg[1]).y - ray.origin!.y);
        if ((txmin > tymax) || (tymin > txmax)) return {hit: false, min: txmin, max: txmax};
        if (tymin > txmin) txmin = tymin;
        if (tymax < txmax) txmax = tymax;
        return {hit: (txmin < ray.maxT!) && (txmax > 0), min: txmin, max: txmax};
    }

    private compact() {
        this.offset = 0;
        if (this.root !== null)
            this.flatten(this.root);
    }

    private flatten(node: BoundingNode) {
        const index = this.offset;
        const myOffset = this.offset++;
        if (node.nPrimitives == 0) {
            this.flatten(node.children[0]);
            const secondOffset = this.flatten(node.children[1]);
            this.nodes[index] = <LinearInternalNode>{bbox: node.bbox, dimension: (<InteriorNode>node).dimension, nPrimitives: 0, secondChildOffset: secondOffset};
        } else {
            this.nodes[index] = <LinearLeafNode>{bbox: node.bbox, primitivesOffset: (<LeafNode>node).firstPrimOffset, nPrimitives: node.nPrimitives}
        }
        return myOffset;
    }

    private createLeaf(start: number, end: number, nPrimitives: number, bbox: BoundingRect) {
        const size = this.orderedPrims.length;
        for (let i=start; i < end; i++)
            this.orderedPrims.push(this.shapes[this.buildData[i].index]);
        return new LeafNode(size, nPrimitives, bbox);
    }
}

// class BVH {
//     nodes: LinearBHVNode[] = [];
//     shapes: string[];
//     constructor(shapes: string[]) {
//         this.shapes = shapes;
//         this.nodes = new BoundingVolume(shapes).nodes;
//     }
//     intersect(start: GlobalPoint, end: GlobalPoint) {
//         let hit = false;
//         let todoOffset = 0;
//         let nodeNum = 0;
//         const todo: number[] = [];
//         while (true) {
//             const node = this.nodes[nodeNum];
//             const result = node.bbox.getIntersectWithLine({start, end}, false);
//             if (result.intersect !== null) {
//                 if (node.nPrimitives > 0) {
//                     for (let i=0; i < node.nPrimitives; i++) {
//                         if (this.shapes[(<LinearLeafNode>node).primitivesOffset + i])
//                     }
//                 } else {

//                 }
//             } else {
//                 if (todoOffset == 0) break;
//                 nodeNum = todo[--todoOffset];
//             }
//         }
//     }
//     // intersect(ray: Vector<GlobalPoint>) {
//     //     let hit = false;
//     //     const origin = ray.origin;
//     //     const invDir = ray.inverse();
//     //     const dirIsNegative = {x: invDir.direction.x < 0, y: invDir.direction.y < 0};
//     //     let todoOffset = 0;
//     //     let nodeNum = 0;
//     //     while (true) {
//     //         const node = this.nodes[nodeNum];
//     //         //if (this.intersectP(node.bbox, ray, invDir, dirIsNegative)) continue;
//     //         if(node.bbox.getIntersectWithLine({})))
//     //     }
//     //     return hit;
//     // }

//     private intersectP(bbox: BoundingRect, ray: Vector<GlobalPoint>, invDir: Vector<GlobalPoint>, dirIsNegative: {x: boolean, y:boolean}) {
        
//     }
// }

export default BoundingVolume;
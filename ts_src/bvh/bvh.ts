import BoundingRect from "../shapes/boundingrect";
import gameManager from "../planarally";
import { LeafNode, InteriorNode, BoundingNode } from "./node";
import { partition } from "../utils";

type buildInfo = {index: number, bbox: BoundingRect, center: BoundingRect};

class BoundingVolume {

    totalNodes = 0;
    buildData: buildInfo[] = [];
    shapes: string[];
    orderedPrims: string[] = [];
    root: BoundingNode;

    constructor(shapes: string[]) {
        this.shapes = shapes;
        for (let i=0; i < shapes.length; i++) {
            const shape = gameManager.layerManager.UUIDMap.get(shapes[i])!;
            const bbox = shape.getBoundingBox();
            this.buildData.push({index: i, bbox: bbox, center: new BoundingRect(shape.center(), 0, 0)});
        }
        this.root = this.recursiveBuild(0, shapes.length);
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

    private createLeaf(start: number, end: number, nPrimitives: number, bbox: BoundingRect) {
        for (let i=start; i < end; i++)
            this.orderedPrims.push(this.shapes[this.buildData[i].index]);
        return new LeafNode(this.orderedPrims.length, nPrimitives, bbox);
    }
}

export default BoundingVolume;
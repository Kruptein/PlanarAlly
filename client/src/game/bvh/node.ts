import BoundingRect from "@/game/shapes/boundingrect";

export class BoundingNode {
    bbox: BoundingRect;
    nPrimitives: number;
    children: BoundingNode[] = [];
    constructor(nPrimitives: number, bbox: BoundingRect) {
        this.nPrimitives = nPrimitives;
        this.bbox = bbox;
    }
}

export class LeafNode extends BoundingNode {
    firstPrimOffset: number;
    constructor(first: number, n: number, bbox: BoundingRect) {
        super(n, bbox);
        this.firstPrimOffset = first;
    }
}

export class InteriorNode extends BoundingNode {
    dimension: number;
    constructor(dimension: number, c1: BoundingNode, c2: BoundingNode) {
        super(0, c1.bbox.union(c2.bbox));
        this.dimension = dimension;
        this.children.push(c1);
        this.children.push(c2);
    }
}

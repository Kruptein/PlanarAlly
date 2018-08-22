export class BoundingNode {
    constructor(nPrimitives, bbox) {
        this.children = [];
        this.nPrimitives = nPrimitives;
        this.bbox = bbox;
    }
}
export class LeafNode extends BoundingNode {
    constructor(first, n, bbox) {
        super(n, bbox);
        this.firstPrimOffset = first;
    }
}
export class InteriorNode extends BoundingNode {
    constructor(dimension, c1, c2) {
        super(0, c1.bbox.union(c2.bbox));
        this.dimension = dimension;
        this.children.push(c1);
        this.children.push(c2);
    }
}
//# sourceMappingURL=node.js.map
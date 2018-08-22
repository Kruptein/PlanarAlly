import { GlobalPoint, Vector } from "../geom";
export default class BoundingRect {
    constructor(topleft, w, h) {
        this.w = w;
        this.h = h;
        this.topLeft = topleft;
        this.topRight = new GlobalPoint(topleft.x + w, topleft.y);
        this.botRight = new GlobalPoint(topleft.x + w, topleft.y + h);
        this.botLeft = new GlobalPoint(topleft.x, topleft.y + h);
    }
    contains(point) {
        return this.topLeft.x <= point.x && this.topRight.x >= point.x &&
            this.topLeft.y <= point.y && this.botLeft.y >= point.y;
    }
    offset(vector) {
        return new BoundingRect(this.topLeft.add(vector), this.w, this.h);
    }
    union(other) {
        const xmin = Math.min(this.topLeft.x, other.topLeft.x);
        const xmax = Math.max(this.topRight.x, other.topRight.x);
        const ymin = Math.min(this.topLeft.y, other.topLeft.y);
        const ymax = Math.max(this.botLeft.y, other.botLeft.y);
        return new BoundingRect(new GlobalPoint(xmin, ymin), xmax - xmin, ymax - ymin);
    }
    getDiagCorner(botright) {
        return botright ? this.botRight : this.topLeft;
    }
    intersectsWith(other) {
        return !(other.topLeft.x > this.topRight.x ||
            other.topRight.x < this.topLeft.x ||
            other.topLeft.y > this.botLeft.y ||
            other.botLeft.y < this.topLeft.y);
    }
    intersectsWithInner(other) {
        return !(other.topLeft.x >= this.topRight.x ||
            other.topRight.x <= this.topLeft.x ||
            other.topLeft.y >= this.botLeft.y ||
            other.botLeft.y <= this.topLeft.y);
    }
    intersectP(ray, invDir, dirIsNeg) {
        let txmin = invDir.x * (this.getDiagCorner(dirIsNeg[0]).x - ray.origin.x);
        let txmax = invDir.x * (this.getDiagCorner(!dirIsNeg[0]).x - ray.origin.x);
        const tymin = invDir.y * (this.getDiagCorner(dirIsNeg[1]).y - ray.origin.y);
        const tymax = invDir.y * (this.getDiagCorner(!dirIsNeg[1]).y - ray.origin.y);
        if ((txmin > tymax) || (tymin > txmax))
            return { hit: false, min: txmin, max: txmax };
        if (tymin > txmin)
            txmin = tymin;
        if (tymax < txmax)
            txmax = tymax;
        return { hit: (txmin < ray.tMax) && (txmax > 0), min: txmin, max: txmax };
    }
    center(centerPoint) {
        if (centerPoint === undefined)
            return this.topLeft.add(new Vector(this.w / 2, this.h / 2));
        this.topLeft.x = centerPoint.x - this.w / 2;
        this.topLeft.y = centerPoint.y - this.h / 2;
    }
    inCorner(point, corner) {
        const sw = Math.min(6, this.w / 2) / 2;
        switch (corner) {
            case 'ne':
                return this.topRight.x - sw <= point.x && point.x <= this.topRight.x + sw && this.topLeft.y - sw <= point.y && point.y <= this.topLeft.y + sw;
            case 'nw':
                return this.topLeft.x - sw <= point.x && point.x <= this.topLeft.x + sw && this.topLeft.y - sw <= point.y && point.y <= this.topLeft.y + sw;
            case 'sw':
                return this.topLeft.x - sw <= point.x && point.x <= this.topLeft.x + sw && this.botLeft.y - sw <= point.y && point.y <= this.botLeft.y + sw;
            case 'se':
                return this.topRight.x - sw <= point.x && point.x <= this.topRight.x + sw && this.botLeft.y - sw <= point.y && point.y <= this.botLeft.y + sw;
            default:
                return false;
        }
    }
    getCorner(point) {
        if (this.inCorner(point, "ne"))
            return "ne";
        else if (this.inCorner(point, "nw"))
            return "nw";
        else if (this.inCorner(point, "se"))
            return "se";
        else if (this.inCorner(point, "sw"))
            return "sw";
    }
    getMaxExtent() {
        return this.w > this.h ? 0 : 1;
    }
}
//# sourceMappingURL=boundingrect.js.map
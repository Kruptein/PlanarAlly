import { getLinesIntersectPoint, getPointDistance, GlobalPoint, Vector } from "../geom";

export default class BoundingRect {
    type = "boundrect";
    refPoint: GlobalPoint;
    w: number;
    h: number;

    constructor(topleft: GlobalPoint, w: number, h: number) {
        this.refPoint = topleft;
        this.w = w;
        this.h = h;
    }

    contains(point: GlobalPoint): boolean {
        return this.refPoint.x <= point.x && (this.refPoint.x + this.w) >= point.x &&
            this.refPoint.y <= point.y && (this.refPoint.y + this.h) >= point.y;
    }

    offset(vector: Vector<GlobalPoint>): BoundingRect {
        return new BoundingRect(this.refPoint.add(vector), this.w, this.h);
    }

    intersectsWith(other: BoundingRect): boolean {
        return !(other.refPoint.x > this.refPoint.x + this.w ||
            other.refPoint.x + other.w < this.refPoint.x ||
            other.refPoint.y > this.refPoint.y + this.h ||
            other.refPoint.y + other.h < this.refPoint.y);
    }
    getIntersectAreaWithRect(other: BoundingRect): BoundingRect {
        const topleft = new GlobalPoint(Math.max(this.refPoint.x, other.refPoint.x), Math.max(this.refPoint.y, other.refPoint.y));
        const w = Math.min(this.refPoint.x + this.w, other.refPoint.x + other.w) - topleft.x;
        const h = Math.min(this.refPoint.y + this.h, other.refPoint.y + other.h) - topleft.y;
        return new BoundingRect(topleft, w, h);
    }
    getIntersectWithLine(line: { start: GlobalPoint; end: GlobalPoint }) {
        const lines = [
            getLinesIntersectPoint(new GlobalPoint(this.refPoint.x, this.refPoint.y), new GlobalPoint(this.refPoint.x + this.w, this.refPoint.y), line.start, line.end),
            getLinesIntersectPoint(new GlobalPoint(this.refPoint.x + this.w, this.refPoint.y), new GlobalPoint(this.refPoint.x + this.w, this.refPoint.y + this.h), line.start, line.end),
            getLinesIntersectPoint(new GlobalPoint(this.refPoint.x, this.refPoint.y), new GlobalPoint(this.refPoint.x, this.refPoint.y + this.h), line.start, line.end),
            getLinesIntersectPoint(new GlobalPoint(this.refPoint.x, this.refPoint.y + this.h), new GlobalPoint(this.refPoint.x + this.w, this.refPoint.y + this.h), line.start, line.end)
        ];
        let min_d = Infinity;
        let min_i = null;
        for (let i = 0; i < lines.length; i++) {
            const l = lines[i];
            if (l.intersect === null) continue;
            const d = getPointDistance(line.start, l.intersect);
            if (min_d > d) {
                min_d = d;
                min_i = l.intersect;
            }
        }
        return { intersect: min_i, distance: min_d }
    }

    center(): GlobalPoint;
    center(centerPoint: GlobalPoint): void;
    center(centerPoint?: GlobalPoint): GlobalPoint | void {
        if (centerPoint === undefined)
            return this.refPoint.add(new Vector<GlobalPoint>({x: this.w/2, y: this.h/2}));
        this.refPoint.x = centerPoint.x - this.w / 2;
        this.refPoint.y = centerPoint.y - this.h / 2;
    }
    inCorner(point: GlobalPoint, corner: string) {
        const sw = Math.min(6, this.w / 2) / 2;
        switch (corner) {
            case 'ne':
                return this.refPoint.x + this.w - sw <= point.x && point.x <= this.refPoint.x + this.w + sw && this.refPoint.y - sw <= point.y && point.y <= this.refPoint.y + sw;
            case 'nw':
                return this.refPoint.x - sw <= point.x && point.x <= this.refPoint.x + sw && this.refPoint.y - sw <= point.y && point.y <= this.refPoint.y + sw;
            case 'sw':
                return this.refPoint.x - sw <= point.x && point.x <= this.refPoint.x + sw && this.refPoint.y + this.h - sw <= point.y && point.y <= this.refPoint.y + this.h + sw;
            case 'se':
                return this.refPoint.x + this.w - sw <= point.x && point.x <= this.refPoint.x + this.w + sw && this.refPoint.y + this.h - sw <= point.y && point.y <= this.refPoint.y + this.h + sw;
            default:
                return false;
        }
    }
    getCorner(point: GlobalPoint): string|undefined {
        if (this.inCorner(point, "ne"))
            return "ne";
        else if (this.inCorner(point, "nw"))
            return "nw";
        else if (this.inCorner(point, "se"))
            return "se";
        else if (this.inCorner(point, "sw"))
            return "sw";
    }
}
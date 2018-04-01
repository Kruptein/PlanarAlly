import { getLinesIntersectPoint, getPointDistance, GlobalPoint } from "../geom";
import { l2gx, l2gy } from "../units";

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

    intersectsWith(other: BoundingRect): boolean {
        return !(other.refPoint.x >= this.refPoint.x + this.w ||
            other.refPoint.x + other.w <= this.refPoint.x ||
            other.refPoint.y >= this.refPoint.y + this.h ||
            other.refPoint.y + other.h <= this.refPoint.y);
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
}
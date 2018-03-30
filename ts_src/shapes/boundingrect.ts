import { getLinesIntersectPoint, getPointDistance } from "../geom";
import { l2wx, l2wy } from "../units";
import { Point } from "../utils";

export class BoundingRect {
    type = "boundrect";
    x: number;
    y: number;
    w: number;
    h: number;

    constructor(x: number, y: number, w: number, h: number) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    contains(x: number, y: number, inWorldCoord: boolean): boolean {
        if (inWorldCoord) {
            x = l2wx(x);
            y = l2wy(y);
        }
        return this.x <= x && (this.x + this.w) >= x &&
            this.y <= y && (this.y + this.h) >= y;
    }

    intersectsWith(other: BoundingRect): boolean {
        return !(other.x >= this.x + this.w ||
            other.x + other.w <= this.x ||
            other.y >= this.y + this.h ||
            other.y + other.h <= this.y);
    }
    getIntersectWithLine(line: { start: Point; end: Point }) {
        const lines = [
            getLinesIntersectPoint({ x: this.x, y: this.y }, { x: this.x + this.w, y: this.y }, line.start, line.end),
            getLinesIntersectPoint({ x: this.x + this.w, y: this.y }, {
                x: this.x + this.w,
                y: this.y + this.h
            }, line.start, line.end),
            getLinesIntersectPoint({ x: this.x, y: this.y }, { x: this.x, y: this.y + this.h }, line.start, line.end),
            getLinesIntersectPoint({ x: this.x, y: this.y + this.h }, {
                x: this.x + this.w,
                y: this.y + this.h
            }, line.start, line.end)
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
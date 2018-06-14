import { getLinesIntersectPoint, getPointDistance, GlobalPoint, Vector } from "../geom";

export default class BoundingRect {
    readonly w: number;
    readonly h: number;
    readonly topLeft: GlobalPoint;
    readonly topRight: GlobalPoint;
    readonly botRight: GlobalPoint;
    readonly botLeft: GlobalPoint;

    constructor(topleft: GlobalPoint, w: number, h: number) {
        this.w = w;
        this.h = h;
        this.topLeft = topleft;
        this.topRight = new GlobalPoint(topleft.x + w, topleft.y);
        this.botRight = new GlobalPoint(topleft.x + w, topleft.y + h);
        this.botLeft = new GlobalPoint(topleft.x, topleft.y + h);
    }

    contains(point: GlobalPoint): boolean {
        return this.topLeft.x <= point.x && this.topRight.x >= point.x &&
            this.topLeft.y <= point.y && this.botLeft.y  >= point.y;
    }

    offset(vector: Vector<GlobalPoint>): BoundingRect {
        return new BoundingRect(this.topLeft.add(vector), this.w, this.h);
    }

    union(other: BoundingRect): BoundingRect {
        const xmin = Math.min(this.topLeft.x, other.topLeft.x);
        const xmax = Math.max(this.topRight.x, other.topRight.x);
        const ymin = Math.min(this.topLeft.y, other.topLeft.y);
        const ymax = Math.max(this.botLeft.y, other.botLeft.y);
        return new BoundingRect(new GlobalPoint(xmin, ymin), xmax-xmin, ymax-ymin);
    }

    getDiagCorner(botright: boolean) {
        return botright ? this.botRight : this.topLeft;
    }

    intersectsWith(other: BoundingRect): boolean {
        return !(other.topLeft.x > this.topRight.x ||
            other.topRight.x < this.topLeft.x ||
            other.topLeft.y > this.botLeft.y ||
            other.botLeft.y < this.topLeft.y);
    }

    intersectsWithInner(other: BoundingRect): boolean {
        return !(other.topLeft.x >= this.topRight.x ||
            other.topRight.x <= this.topLeft.x ||
            other.topLeft.y >= this.botLeft.y ||
            other.botLeft.y <= this.topLeft.y);
    }


    getIntersectAreaWithRect(other: BoundingRect): BoundingRect {
        const topleft = new GlobalPoint(Math.max(this.topLeft.x, other.topLeft.x), Math.max(this.topLeft.y, other.topLeft.y));
        const w = Math.min(this.topRight.x, other.topRight.x) - topleft.x;
        const h = Math.min(this.botLeft.y, other.botLeft.y) - topleft.y;
        return new BoundingRect(topleft, w, h);
    }
    getIntersectWithLine(line: { start: GlobalPoint; end: GlobalPoint }, skipZero: boolean) {
        const lines = [
            getLinesIntersectPoint(this.topLeft, this.topRight, line.start, line.end),
            getLinesIntersectPoint(this.topLeft, this.botLeft, line.start, line.end),
            getLinesIntersectPoint(this.topRight, this.botRight, line.start, line.end),
            getLinesIntersectPoint(this.botLeft, this.botRight, line.start, line.end)
        ];
        let min_d = Infinity;
        let min_i = null;
        for (let i = 0; i < lines.length; i++) {
            const l = lines[i];
            if (l.intersect === null) continue;
            const d = getPointDistance(line.start, l.intersect);
            if (min_d > d) {
                if (skipZero && d === 0) continue;
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
            return this.topLeft.add(new Vector<GlobalPoint>({x: this.w/2, y: this.h/2}));
        this.topLeft.x = centerPoint.x - this.w / 2;
        this.topLeft.y = centerPoint.y - this.h / 2;
    }
    inCorner(point: GlobalPoint, corner: string) {
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

    getMaxExtent() {
        return this.w > this.h ? 0 : 1;
    }
}
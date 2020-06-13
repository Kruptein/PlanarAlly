import { GlobalPoint, Point, Ray, Vector } from "@/game/geom";
import { g2lx, g2ly } from "../units";

export class BoundingRect {
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
        return (
            this.topLeft.x <= point.x &&
            this.topRight.x >= point.x &&
            this.topLeft.y <= point.y &&
            this.botLeft.y >= point.y
        );
    }

    get points(): number[][] {
        if (this.w === 0 || this.h === 0) return [[this.topLeft.x, this.topLeft.y]];
        return [
            [this.topLeft.x, this.topLeft.y],
            [this.botLeft.x, this.botLeft.y],
            [this.botRight.x, this.botRight.y],
            [this.topRight.x, this.topRight.y],
        ];
    }

    offset(vector: Vector): BoundingRect {
        return new BoundingRect(this.topLeft.add(vector), this.w, this.h);
    }

    union(other: BoundingRect): BoundingRect {
        const xmin = Math.min(this.topLeft.x, other.topLeft.x);
        const xmax = Math.max(this.topRight.x, other.topRight.x);
        const ymin = Math.min(this.topLeft.y, other.topLeft.y);
        const ymax = Math.max(this.botLeft.y, other.botLeft.y);
        return new BoundingRect(new GlobalPoint(xmin, ymin), xmax - xmin, ymax - ymin);
    }

    getDiagCorner(botright: boolean): GlobalPoint {
        return botright ? this.botRight : this.topLeft;
    }

    intersectsWith(other: BoundingRect): boolean {
        return !(
            other.topLeft.x > this.topRight.x ||
            other.topRight.x < this.topLeft.x ||
            other.topLeft.y > this.botLeft.y ||
            other.botLeft.y < this.topLeft.y
        );
    }

    intersectsWithInner(other: BoundingRect): boolean {
        return !(
            other.topLeft.x >= this.topRight.x ||
            other.topRight.x <= this.topLeft.x ||
            other.topLeft.y >= this.botLeft.y ||
            other.botLeft.y <= this.topLeft.y
        );
    }

    intersectP(ray: Ray<Point>, invDir: Vector, dirIsNeg: boolean[]): { hit: boolean; min: number; max: number } {
        let txmin = invDir.x * (this.getDiagCorner(dirIsNeg[0]).x - ray.origin.x);
        let txmax = invDir.x * (this.getDiagCorner(!dirIsNeg[0]).x - ray.origin.x);
        const tymin = invDir.y * (this.getDiagCorner(dirIsNeg[1]).y - ray.origin.y);
        const tymax = invDir.y * (this.getDiagCorner(!dirIsNeg[1]).y - ray.origin.y);
        if (txmin > tymax || tymin > txmax) return { hit: false, min: txmin, max: txmax };
        if (tymin > txmin) txmin = tymin;
        if (tymax < txmax) txmax = tymax;
        return { hit: txmin < ray.tMax && txmax > 0, min: txmin, max: txmax };
    }

    center(): GlobalPoint {
        return this.topLeft.add(new Vector(this.w / 2, this.h / 2));
    }

    getMaxExtent(): 0 | 1 {
        return this.w > this.h ? 0 : 1;
    }
    visibleInCanvas(canvas: HTMLCanvasElement): boolean {
        const coreVisible = !(
            g2lx(this.topLeft.x) > canvas.width ||
            g2ly(this.topLeft.y) > canvas.height ||
            g2lx(this.topRight.x) < 0 ||
            g2ly(this.botRight.y) < 0
        );
        if (coreVisible) return true;
        return false;
    }
}

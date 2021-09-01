import { g2lx, g2ly } from "../../../core/conversions";
import { Vector, toGP, addP } from "../../../core/geometry";
import type { GlobalPoint, Point, Ray } from "../../../core/geometry";
import { rotateAroundPoint } from "../../../core/math";

export class BoundingRect {
    readonly w: number;
    readonly h: number;
    readonly topLeft: GlobalPoint;
    readonly topRight: GlobalPoint;
    readonly botRight: GlobalPoint;
    readonly botLeft: GlobalPoint;

    private _angle: number;

    constructor(topleft: GlobalPoint, w: number, h: number) {
        this._angle = 0;
        this.w = w;
        this.h = h;
        this.topLeft = topleft;
        this.topRight = toGP(topleft.x + w, topleft.y);
        this.botRight = toGP(topleft.x + w, topleft.y + h);
        this.botLeft = toGP(topleft.x, topleft.y + h);
    }

    get angle(): number {
        return this._angle;
    }

    set angle(angle: number) {
        this._angle = angle;
    }

    contains(point: GlobalPoint): boolean {
        if (this.angle !== 0) point = rotateAroundPoint(point, this.center(), -this.angle);
        return (
            this.topLeft.x <= point.x &&
            this.topRight.x >= point.x &&
            this.topLeft.y <= point.y &&
            this.botLeft.y >= point.y
        );
    }

    get points(): [number, number][] {
        if (this.w === 0 || this.h === 0) return [[this.topLeft.x, this.topLeft.y]];

        const center = this.center();

        const topleft = rotateAroundPoint(this.topLeft, center, this.angle);
        const botleft = rotateAroundPoint(this.botLeft, center, this.angle);
        const botright = rotateAroundPoint(this.botRight, center, this.angle);
        const topright = rotateAroundPoint(this.topRight, center, this.angle);
        return [
            [topleft.x, topleft.y],
            [botleft.x, botleft.y],
            [botright.x, botright.y],
            [topright.x, topright.y],
        ];
    }

    offset(vector: Vector): BoundingRect {
        return new BoundingRect(addP(this.topLeft, vector), this.w, this.h);
    }

    expand(vector: Vector): BoundingRect {
        return new BoundingRect(
            addP(this.topLeft, vector),
            this.w + 2 * Math.abs(vector.x),
            this.h + 2 * Math.abs(vector.y),
        );
    }

    union(other: BoundingRect): BoundingRect {
        const xmin = Math.min(this.topLeft.x, other.topLeft.x);
        const xmax = Math.max(this.topRight.x, other.topRight.x);
        const ymin = Math.min(this.topLeft.y, other.topLeft.y);
        const ymax = Math.max(this.botLeft.y, other.botLeft.y);
        return new BoundingRect(toGP(xmin, ymin), xmax - xmin, ymax - ymin);
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

    containsRay(ray: Ray<Point>): { hit: boolean; min: number; max: number } {
        const invDir = ray.direction.inverse();
        const dirIsNeg = [invDir.x < 0, invDir.y < 0];
        let txmin = invDir.x * (this.getDiagCorner(dirIsNeg[0]).x - ray.origin.x);
        let txmax = invDir.x * (this.getDiagCorner(!dirIsNeg[0]).x - ray.origin.x);
        const tymin = invDir.y * (this.getDiagCorner(dirIsNeg[1]).y - ray.origin.y);
        const tymax = invDir.y * (this.getDiagCorner(!dirIsNeg[1]).y - ray.origin.y);
        if (txmin > tymax || tymin > txmax) return { hit: false, min: txmin, max: txmax };
        if (tymin > txmin) txmin = tymin;
        if (tymax < txmax) txmax = tymax;
        return { hit: txmin < ray.tMax && txmax > 0, min: txmin, max: txmax };
    }

    center(): GlobalPoint;
    center(centerPoint: GlobalPoint): BoundingRect;
    center(centerPoint?: GlobalPoint): GlobalPoint | BoundingRect {
        if (centerPoint === undefined) return addP(this.topLeft, new Vector(this.w / 2, this.h / 2));
        return new BoundingRect(toGP(centerPoint.x - this.w / 2, centerPoint.y - this.h / 2), this.w, this.h);
    }

    getMaxExtent(): 0 | 1 {
        return this.w > this.h ? 0 : 1;
    }
    visibleInCanvas(max: { w: number; h: number }): boolean {
        const coreVisible = !(
            g2lx(this.topLeft.x) > max.w ||
            g2ly(this.topLeft.y) > max.h ||
            g2lx(this.topRight.x) < 0 ||
            g2ly(this.botRight.y) < 0
        );
        if (coreVisible) return true;
        return false;
    }

    rotateAround(point: GlobalPoint, angle: number): BoundingRect {
        const center = this.center();
        const newCenter = rotateAroundPoint(center, point, angle);

        const bb = new BoundingRect(
            addP(this.topLeft, new Vector(newCenter.x - center.x, newCenter.y - center.y)),
            this.w,
            this.h,
        );
        bb.angle = this.angle + angle;
        return bb;
    }

    rotateAroundAbsolute(point: GlobalPoint, angle: number): BoundingRect {
        return this.rotateAround(point, angle - this.angle);
    }
}

import { g2l, g2lx, g2ly, g2lz } from "../../../core/conversions";
import { addP, subtractP, toArrayP, toGP } from "../../../core/geometry";
import type { GlobalPoint } from "../../../core/geometry";
import { rotateAroundPoint } from "../../../core/math";
import type { GlobalId, LocalId } from "../../id";
import type { ServerLine } from "../../models/shapes";
import { Shape } from "../shape";
import type { SHAPE_TYPE } from "../types";

import { BoundingRect } from "./boundingRect";

export class Line extends Shape {
    type: SHAPE_TYPE = "line";
    private _endPoint: GlobalPoint;
    lineWidth: number;
    constructor(
        startPoint: GlobalPoint,
        endPoint: GlobalPoint,
        options?: {
            lineWidth?: number;
            strokeColour?: string[];
            id?: LocalId;
            uuid?: GlobalId;
            isSnappable?: boolean;
        },
    ) {
        super(startPoint, { fillColour: "rgba(0, 0, 0, 0)", strokeColour: ["#000"], ...options });
        this._endPoint = endPoint;
        this.lineWidth = options?.lineWidth ?? 1;
    }

    get endPoint(): GlobalPoint {
        return this._endPoint;
    }

    set endPoint(point: GlobalPoint) {
        this._endPoint = point;
        this.invalidatePoints();
    }

    get isClosed(): boolean {
        return false;
    }

    getPositionRepresentation(): { angle: number; points: [number, number][] } {
        return { angle: this.angle, points: [toArrayP(this.refPoint), toArrayP(this.endPoint)] };
    }

    setPositionRepresentation(position: { angle: number; points: [number, number][] }): void {
        this.endPoint = toGP(position.points[1]);
        super.setPositionRepresentation(position);
    }

    asDict(): ServerLine {
        return Object.assign(this.getBaseDict(), {
            x2: this.endPoint.x,
            y2: this.endPoint.y,
            line_width: this.lineWidth,
        });
    }

    invalidatePoints(): void {
        this._points = [
            toArrayP(rotateAroundPoint(this.refPoint, this.center(), this.angle)),
            toArrayP(rotateAroundPoint(this.endPoint, this.center(), this.angle)),
        ];
    }

    getBoundingBox(): BoundingRect {
        return new BoundingRect(
            toGP(Math.min(this.refPoint.x, this.endPoint.x), Math.min(this.refPoint.y, this.endPoint.y)),
            Math.abs(this.refPoint.x - this.endPoint.x),
            Math.abs(this.refPoint.y - this.endPoint.y),
        );
    }

    draw(ctx: CanvasRenderingContext2D): void {
        super.draw(ctx);

        const center = g2l(this.center());

        ctx.strokeStyle = this.strokeColour[0];
        ctx.beginPath();
        ctx.moveTo(g2lx(this.refPoint.x) - center.x, g2ly(this.refPoint.y) - center.y);
        ctx.lineTo(g2lx(this.endPoint.x) - center.x, g2ly(this.endPoint.y) - center.y);
        ctx.lineWidth = this.ignoreZoomSize ? this.lineWidth : g2lz(this.lineWidth);
        ctx.stroke();
        super.drawPost(ctx);
    }

    contains(_point: GlobalPoint): boolean {
        return false; // TODO
    }

    center(): GlobalPoint;
    center(centerPoint: GlobalPoint): void;
    center(centerPoint?: GlobalPoint): GlobalPoint | void {
        if (centerPoint === undefined)
            return addP(this.refPoint, subtractP(this.endPoint, this.refPoint).multiply(1 / 2));
        const oldCenter = this.center();
        this.refPoint = toGP(subtractP(centerPoint, subtractP(oldCenter, this.refPoint)).asArray());
        this.endPoint = toGP(subtractP(centerPoint, subtractP(oldCenter, this.endPoint)).asArray());
    }

    visibleInCanvas(max: { w: number; h: number }, options: { includeAuras: boolean }): boolean {
        if (super.visibleInCanvas(max, options)) return true;
        return this.getBoundingBox().visibleInCanvas(max);
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    snapToGrid(): void {}

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    resizeToGrid(): void {}

    resize(resizePoint: number, point: GlobalPoint): number {
        if (resizePoint === 0) this.refPoint = point;
        else this.endPoint = point;
        return resizePoint;
    }
}

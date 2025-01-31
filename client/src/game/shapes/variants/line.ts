import { exportShapeData } from "..";
import type { ApiLineShape } from "../../../apiTypes";
import { g2l, g2lx, g2ly, g2lz } from "../../../core/conversions";
import { addP, subtractP, toArrayP, toGP } from "../../../core/geometry";
import type { GlobalPoint } from "../../../core/geometry";
import type { GlobalId, LocalId } from "../../../core/id";
import { rotateAroundPoint } from "../../../core/math";
import { getColour } from "../../colour";
import type { IShape } from "../../interfaces/shape";
import { getProperties } from "../../systems/properties/state";
import type { ShapeProperties } from "../../systems/properties/state";
import { Shape } from "../shape";
import type { SHAPE_TYPE } from "../types";

import { BoundingRect } from "./simple/boundingRect";

export class Line extends Shape implements IShape {
    type: SHAPE_TYPE = "line";
    private _endPoint: GlobalPoint;
    lineWidth: number;
    constructor(
        startPoint: GlobalPoint,
        endPoint: GlobalPoint,
        options?: {
            lineWidth?: number;
            id?: LocalId;
            uuid?: GlobalId;
            isSnappable?: boolean;
        },
        properties?: Partial<ShapeProperties>,
    ) {
        super(startPoint, options, { fillColour: "rgba(0, 0, 0, 0)", strokeColour: ["#000"], ...properties });
        this._endPoint = endPoint;
        this._center = this.__center();
        this.lineWidth = options?.lineWidth ?? 1;
    }

    get endPoint(): GlobalPoint {
        return this._endPoint;
    }

    set endPoint(point: GlobalPoint) {
        this._endPoint = point;
        this.invalidatePoints();
    }

    readonly isClosed = false;

    getPositionRepresentation(): { angle: number; points: [number, number][] } {
        return { angle: this.angle, points: [toArrayP(this.refPoint), toArrayP(this.endPoint)] };
    }

    setPositionRepresentation(position: { angle: number; points: [number, number][] }): void {
        if (position.points.length < 2) {
            console.error("Attempt to set position representation with not enough points");
            return;
        }

        this.endPoint = toGP(position.points[1]!);
        super.setPositionRepresentation(position);
    }

    asDict(): ApiLineShape {
        return { ...exportShapeData(this), x2: this.endPoint.x, y2: this.endPoint.y, line_width: this.lineWidth };
    }

    updatePoints(): void {
        this._points = [
            toArrayP(rotateAroundPoint(this.refPoint, this.center, this.angle)),
            toArrayP(rotateAroundPoint(this.endPoint, this.center, this.angle)),
        ];
    }

    getBoundingBox(): BoundingRect {
        return new BoundingRect(
            toGP(Math.min(this.refPoint.x, this.endPoint.x), Math.min(this.refPoint.y, this.endPoint.y)),
            Math.abs(this.refPoint.x - this.endPoint.x),
            Math.abs(this.refPoint.y - this.endPoint.y),
        );
    }

    draw(ctx: CanvasRenderingContext2D, lightRevealRender: boolean): void {
        super.draw(ctx, lightRevealRender);

        if (!lightRevealRender) {
            const center = g2l(this.center);
            const props = getProperties(this.id)!;

            ctx.strokeStyle = getColour(props.strokeColour[0]!, this.id);
            ctx.beginPath();
            ctx.moveTo(g2lx(this.refPoint.x) - center.x, g2ly(this.refPoint.y) - center.y);
            ctx.lineTo(g2lx(this.endPoint.x) - center.x, g2ly(this.endPoint.y) - center.y);
            ctx.lineWidth = this.ignoreZoomSize ? this.lineWidth : g2lz(this.lineWidth);
            ctx.stroke();
        }

        super.drawPost(ctx, lightRevealRender);
    }

    contains(_point: GlobalPoint): boolean {
        return false; // TODO
    }

    __center(): GlobalPoint {
        return addP(this.refPoint, subtractP(this.endPoint, this.refPoint).multiply(1 / 2));
    }

    get center(): GlobalPoint {
        return this._center;
    }

    set center(centerPoint: GlobalPoint) {
        const oldCenter = this.center;
        this.endPoint = toGP(subtractP(centerPoint, subtractP(oldCenter, this.endPoint)).asArray());
        this.refPoint = toGP(subtractP(centerPoint, subtractP(oldCenter, this.refPoint)).asArray());
    }

    visibleInCanvas(max: { w: number; h: number }, options: { includeAuras: boolean }): boolean {
        if (super.visibleInCanvas(max, options)) return true;
        return this.getBoundingBox().visibleInCanvas(max);
    }

    resize(resizePoint: number, point: GlobalPoint): number {
        if (resizePoint === 0) this.refPoint = point;
        else this.endPoint = point;
        return resizePoint;
    }
}

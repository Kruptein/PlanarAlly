import { exportShapeData } from "..";
import type { ApiCircleShape } from "../../../apiTypes";
import { g2lz } from "../../../core/conversions";
import { addP, subtractP, toArrayP, toGP, Vector } from "../../../core/geometry";
import type { GlobalPoint } from "../../../core/geometry";
import type { GlobalId, LocalId } from "../../../core/id";
import { getColour } from "../../colour";
import type { IShape } from "../../interfaces/shape";
import type { ServerShapeOptions } from "../../models/shapes";
import { getProperties } from "../../systems/properties/state";
import type { ShapeProperties } from "../../systems/properties/state";
import { Shape } from "../shape";
import type { SHAPE_TYPE } from "../types";

import { BoundingRect } from "./simple/boundingRect";

export class Circle extends Shape implements IShape {
    type: SHAPE_TYPE = "circle";
    private _r: number;
    // circle if 360 otherwise a cone
    viewingAngle: number | null; // Do not confuse with angle, which is the direction!

    constructor(
        center: GlobalPoint,
        r: number,
        options?: {
            viewingAngle?: number;
            id?: LocalId;
            uuid?: GlobalId;
            strokeWidth?: number;
            isSnappable?: boolean;
        },
        properties?: Partial<ShapeProperties>,
    ) {
        super(center, options, properties);
        this._r = r || 1;
        this._center = this.__center();
        this.viewingAngle = options?.viewingAngle ?? null;
    }

    get r(): number {
        return this._r;
    }

    set r(r: number) {
        if (r > 0) {
            this._r = r;
            this.invalidatePoints();
        }
    }

    readonly isClosed = true;

    asDict(): ApiCircleShape {
        return { ...exportShapeData(this), radius: this.r, viewing_angle: this.viewingAngle };
    }

    fromDict(data: ApiCircleShape, options: Partial<ServerShapeOptions>): void {
        super.fromDict(data, options);
        this.r = data.radius;
        this.viewingAngle = data.viewing_angle;
    }

    getBoundingBox(): BoundingRect {
        return new BoundingRect(toGP(this.refPoint.x - this.r, this.refPoint.y - this.r), this.r * 2, this.r * 2);
    }

    updatePoints(): void {
        const ps = [];
        const r = this.r;
        const k = 0.75 / r;
        const N = Math.ceil(Math.PI / Math.sqrt(2 * k));
        const double_pi = Math.PI * 2;
        for (let i = 0; i < double_pi; i += double_pi / N) {
            ps.push(toArrayP(addP(this.center, new Vector(r * Math.cos(i), r * Math.sin(i)))));
        }
        this._shadowPoints = ps;
        this._points = this.getBoundingBox().points;
    }

    draw(ctx: CanvasRenderingContext2D, lightRevealRender: boolean): void {
        super.draw(ctx, lightRevealRender);
        const props = getProperties(this.id)!;
        ctx.beginPath();

        if (!lightRevealRender) {
            ctx.fillStyle = getColour(props.fillColour, this.id);
        }

        this.drawArc(ctx, this.ignoreZoomSize ? this.r : g2lz(this.r));
        ctx.fill();

        if (!lightRevealRender) {
            if (props.strokeColour[0] !== "rgba(0, 0, 0, 0)") {
                const ogOperation = ctx.globalCompositeOperation;
                if (this.options.borderOperation !== undefined)
                    ctx.globalCompositeOperation = this.options.borderOperation;
                ctx.beginPath();
                ctx.lineWidth = this.ignoreZoomSize ? this.strokeWidth : g2lz(this.strokeWidth);
                ctx.strokeStyle = getColour(props.strokeColour[0]!, this.id);
                // Inset the border with - borderWidth / 2
                // Slight imperfection added to account for zoom subpixel differences
                const r = this.r - this.strokeWidth / 2.5;
                this.drawArc(ctx, Math.max(this.strokeWidth / 2, this.ignoreZoomSize ? r : g2lz(r)));
                ctx.stroke();
                ctx.globalCompositeOperation = ogOperation;
            }
        }

        super.drawPost(ctx, lightRevealRender);
    }

    private drawArc(ctx: CanvasRenderingContext2D, r: number): void {
        const vAngle = this.viewingAngle ?? 2 * Math.PI;

        const angleA = vAngle === 2 * Math.PI ? 0 : -vAngle / 2;
        const angleB = vAngle === 2 * Math.PI ? Math.PI * 2 : vAngle / 2;

        if (vAngle < 2 * Math.PI) {
            ctx.moveTo(0, 0);
            ctx.lineTo(r * Math.cos(angleA), r * Math.sin(angleA));
        }
        ctx.arc(0, 0, r, angleA, angleB);
        if (vAngle < 2 * Math.PI) {
            ctx.lineTo(0, 0);
        }
    }

    contains(point: GlobalPoint): boolean {
        return (point.x - this.refPoint.x) ** 2 + (point.y - this.refPoint.y) ** 2 < this.r ** 2;
    }

    __center(): GlobalPoint {
        return this.refPoint;
    }

    get center(): GlobalPoint {
        return this._center;
    }

    set center(centerPoint: GlobalPoint) {
        this.refPoint = centerPoint;
    }

    visibleInCanvas(max: { w: number; h: number }, options: { includeAuras: boolean }): boolean {
        if (super.visibleInCanvas(max, options)) return true;
        return this.getBoundingBox().visibleInCanvas(max);
    }

    resize(resizePoint: number, point: GlobalPoint): number {
        const diff = subtractP(point, this.refPoint);
        this.r = Math.sqrt(Math.pow(diff.length(), 2) / 2);
        return resizePoint;
    }
}

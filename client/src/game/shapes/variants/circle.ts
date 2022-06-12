import { g2lz, clampGridLine } from "../../../core/conversions";
import { addP, subtractP, toGP, Vector } from "../../../core/geometry";
import type { GlobalPoint } from "../../../core/geometry";
import { DEFAULT_GRID_SIZE } from "../../../store/client";
import { getFogColour } from "../../colour";
import { calculateDelta } from "../../drag";
import type { GlobalId, LocalId } from "../../id";
import type { ServerCircle } from "../../models/shapes";
import { Shape } from "../shape";
import type { SHAPE_TYPE } from "../types";

import { BoundingRect } from "./boundingRect";

export class Circle extends Shape {
    type: SHAPE_TYPE = "circle";
    private _r: number;
    // circle if 360 otherwise a cone
    viewingAngle: number | null; // Do not confuse with angle, which is the direction!

    constructor(
        center: GlobalPoint,
        r: number,
        options?: {
            fillColour?: string;
            strokeColour?: string[];
            viewingAngle?: number;
            id?: LocalId;
            uuid?: GlobalId;
            strokeWidth?: number;
            isSnappable?: boolean;
        },
    ) {
        super(center, options);
        this._r = r || 1;
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

    get isClosed(): boolean {
        return true;
    }

    asDict(): ServerCircle {
        return Object.assign(this.getBaseDict(), {
            radius: this.r,
            viewing_angle: this.viewingAngle,
        });
    }

    fromDict(data: ServerCircle): void {
        super.fromDict(data);
        this.r = data.radius;
        this.viewingAngle = data.viewing_angle;
    }

    getBoundingBox(): BoundingRect {
        return new BoundingRect(toGP(this.refPoint.x - this.r, this.refPoint.y - this.r), this.r * 2, this.r * 2);
    }

    invalidatePoints(): void {
        this._points = this.getBoundingBox().points;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        super.draw(ctx);
        ctx.beginPath();
        if (this.fillColour === "fog") ctx.fillStyle = getFogColour();
        else ctx.fillStyle = this.fillColour;

        this.drawArc(ctx, this.ignoreZoomSize ? this.r : g2lz(this.r));
        ctx.fill();

        if (this.strokeColour[0] !== "rgba(0, 0, 0, 0)") {
            const ogOperation = ctx.globalCompositeOperation;
            if (this.options.borderOperation !== undefined) ctx.globalCompositeOperation = this.options.borderOperation;
            ctx.beginPath();
            ctx.lineWidth = this.ignoreZoomSize ? this.strokeWidth : g2lz(this.strokeWidth);
            ctx.strokeStyle = this.strokeColour[0];
            // Inset the border with - borderWidth / 2
            // Slight imperfection added to account for zoom subpixel differences
            const r = this.r - this.strokeWidth / 2.5;
            this.drawArc(ctx, Math.max(this.strokeWidth / 2, this.ignoreZoomSize ? r : g2lz(r)));
            ctx.stroke();
            ctx.globalCompositeOperation = ogOperation;
        }
        super.drawPost(ctx);
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

    center(): GlobalPoint;
    center(centerPoint: GlobalPoint): void;
    center(centerPoint?: GlobalPoint): GlobalPoint | void {
        if (centerPoint === undefined) return this.refPoint;
        this.refPoint = centerPoint;
    }

    visibleInCanvas(max: { w: number; h: number }, options: { includeAuras: boolean }): boolean {
        if (super.visibleInCanvas(max, options)) return true;
        return this.getBoundingBox().visibleInCanvas(max);
    }

    snapToGrid(): void {
        const gs = DEFAULT_GRID_SIZE;
        let targetX;
        let targetY;
        if (((2 * this.r) / gs) % 2 === 0) {
            targetX = clampGridLine(this.refPoint.x);
        } else {
            targetX = Math.round((this.refPoint.x - gs / 2) / gs) * gs + this.r;
        }
        if (((2 * this.r) / gs) % 2 === 0) {
            targetY = clampGridLine(this.refPoint.y);
        } else {
            targetY = Math.round((this.refPoint.y - gs / 2) / gs) * gs + this.r;
        }
        const delta = calculateDelta(new Vector(targetX - this.refPoint.x, targetY - this.refPoint.y), this);
        this.refPoint = addP(this.refPoint, delta);
        this.invalidate(false);
    }

    resizeToGrid(): void {
        const gs = DEFAULT_GRID_SIZE;
        this.r = Math.max(clampGridLine(this.r), gs / 2);
        this.invalidate(false);
    }

    resize(resizePoint: number, point: GlobalPoint): number {
        const diff = subtractP(point, this.refPoint);
        this.r = Math.sqrt(Math.pow(diff.length(), 2) / 2);
        return resizePoint;
    }
}

import { GlobalPoint } from "@/game/geom";
import { Shape } from "@/game/shapes/shape";
import { BoundingRect } from "@/game/shapes/variants/boundingrect";
import { g2l, g2lx, g2ly, g2lz } from "@/game/units";

import { ServerLine } from "../../comm/types/shapes";
import { rotateAroundPoint } from "../../utils";
import { SHAPE_TYPE } from "../types";

export class Line extends Shape {
    type: SHAPE_TYPE = "line";
    endPoint: GlobalPoint;
    lineWidth: number;
    constructor(
        startPoint: GlobalPoint,
        endPoint: GlobalPoint,
        options?: {
            lineWidth?: number;
            strokeColour?: string;
            uuid?: string;
        },
    ) {
        super(startPoint, { fillColour: "rgba(0, 0, 0, 0)", strokeColour: "#000", ...options });
        this.endPoint = endPoint;
        this.lineWidth = options?.lineWidth ?? 1;
    }

    get isClosed(): boolean {
        return false;
    }

    getPositionRepresentation(): { angle: number; points: number[][] } {
        return { angle: this.angle, points: [this.refPoint.asArray(), this.endPoint.asArray()] };
    }

    setPositionRepresentation(position: { angle: number; points: number[][] }): void {
        this.endPoint = GlobalPoint.fromArray(position.points[1]);
        super.setPositionRepresentation(position);
    }

    asDict(): ServerLine {
        return Object.assign(this.getBaseDict(), {
            x2: this.endPoint.x,
            y2: this.endPoint.y,
            line_width: this.lineWidth,
        });
    }

    get points(): number[][] {
        return [
            [...rotateAroundPoint(this.refPoint, this.center(), this.angle)],
            [...rotateAroundPoint(this.endPoint, this.center(), this.angle)],
        ];
    }
    getBoundingBox(): BoundingRect {
        return new BoundingRect(
            new GlobalPoint(Math.min(this.refPoint.x, this.endPoint.x), Math.min(this.refPoint.y, this.endPoint.y)),
            Math.abs(this.refPoint.x - this.endPoint.x),
            Math.abs(this.refPoint.y - this.endPoint.y),
        );
    }
    draw(ctx: CanvasRenderingContext2D): void {
        super.draw(ctx);

        const center = g2l(this.center());

        ctx.strokeStyle = this.strokeColour;
        ctx.beginPath();
        ctx.moveTo(g2lx(this.refPoint.x) - center.x, g2ly(this.refPoint.y) - center.y);
        ctx.lineTo(g2lx(this.endPoint.x) - center.x, g2ly(this.endPoint.y) - center.y);
        ctx.lineWidth = g2lz(this.lineWidth);
        ctx.stroke();
        super.drawPost(ctx);
    }
    contains(_point: GlobalPoint): boolean {
        return false; // TODO
    }

    center(): GlobalPoint;
    center(centerPoint: GlobalPoint): void;
    center(centerPoint?: GlobalPoint): GlobalPoint | void {
        if (centerPoint === undefined) return this.refPoint.add(this.endPoint.subtract(this.refPoint).multiply(1 / 2));
        const oldCenter = this.center();
        this.refPoint = GlobalPoint.fromArray([...centerPoint.subtract(oldCenter.subtract(this.refPoint))]);
        this.endPoint = GlobalPoint.fromArray([...centerPoint.subtract(oldCenter.subtract(this.endPoint))]);
    }
    visibleInCanvas(canvas: HTMLCanvasElement, options: { includeAuras: boolean }): boolean {
        if (super.visibleInCanvas(canvas, options)) return true;
        return this.getBoundingBox().visibleInCanvas(canvas);
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

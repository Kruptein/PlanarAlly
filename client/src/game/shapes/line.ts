import { GlobalPoint } from "@/game/geom";
import { BoundingRect } from "@/game/shapes/boundingrect";
import { Shape } from "@/game/shapes/shape";
import { g2lx, g2ly, g2lz } from "@/game/units";
import { ServerLine } from "../comm/types/shapes";

export class Line extends Shape {
    type = "line";
    endPoint: GlobalPoint;
    lineWidth: number;
    constructor(
        startPoint: GlobalPoint,
        endPoint: GlobalPoint,
        lineWidth?: number,
        strokeColour?: string,
        uuid?: string,
    ) {
        super(startPoint, "rgba(0, 0, 0, 0)", strokeColour || "#000", uuid);
        this.endPoint = endPoint;
        this.lineWidth = lineWidth === undefined ? 1 : lineWidth;
    }

    get isClosed(): boolean {
        return false;
    }

    asDict(): ServerLine {
        return Object.assign(this.getBaseDict(), {
            x2: this.endPoint.x,
            y2: this.endPoint.y,
            // eslint-disable-next-line @typescript-eslint/camelcase
            line_width: this.lineWidth,
        });
    }
    get points(): number[][] {
        return [
            [this.refPoint.x, this.refPoint.y],
            [this.endPoint.x, this.endPoint.y],
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
        ctx.strokeStyle = this.strokeColour;
        ctx.beginPath();
        ctx.moveTo(g2lx(this.refPoint.x), g2ly(this.refPoint.y));
        ctx.lineTo(g2lx(this.endPoint.x), g2ly(this.endPoint.y));
        ctx.lineWidth = g2lz(this.lineWidth);
        ctx.stroke();
        super.drawPost(ctx);
    }
    contains(_point: GlobalPoint): boolean {
        return false; // TODO
    }

    center(): GlobalPoint;
    center(centerPoint: GlobalPoint): void;
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    center(_centerPoint?: GlobalPoint): GlobalPoint | void {} // TODO
    visibleInCanvas(canvas: HTMLCanvasElement): boolean {
        return this.getBoundingBox().visibleInCanvas(canvas);
    } // TODO
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

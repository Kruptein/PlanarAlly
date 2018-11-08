import BoundingRect from "./boundingrect";
import Shape from "./shape";

import { GlobalPoint, LocalPoint } from "../geom";
import { g2lx, g2ly } from "../units";

export default class Line extends Shape {
    type = "line";
    endPoint: GlobalPoint;
    lineWidth: number;
    constructor(startPoint: GlobalPoint, endPoint: GlobalPoint, lineWidth?: number, strokeColour?: string, uuid?: string) {
        super(startPoint, 'rgba(0, 0, 0, 0)', strokeColour || '#000', uuid);
        this.endPoint = endPoint;
        this.lineWidth = lineWidth === undefined ? 1 : lineWidth;
    }
    asDict() {
        return Object.assign(this.getBaseDict(), {
            x2: this.endPoint.x,
            y2: this.endPoint.y,
            lineWidth: this.lineWidth,
        });
    }
    getBoundingBox(): BoundingRect {
        return new BoundingRect(
            new GlobalPoint(Math.min(this.refPoint.x, this.endPoint.x), Math.min(this.refPoint.x, this.endPoint.y)),
            Math.abs(this.refPoint.x - this.endPoint.x),
            Math.abs(this.refPoint.y - this.endPoint.y),
        );
    }
    draw(ctx: CanvasRenderingContext2D) {
        super.draw(ctx);
        ctx.strokeStyle = this.strokeColour;
        ctx.beginPath();
        ctx.moveTo(g2lx(this.refPoint.x), g2ly(this.refPoint.y));
        ctx.lineTo(g2lx(this.endPoint.x), g2ly(this.endPoint.y));
        ctx.lineWidth = this.lineWidth;
        ctx.stroke();
    }
    contains(point: GlobalPoint): boolean {
        return false; // TODO
    }

    center(): GlobalPoint;
    center(centerPoint: GlobalPoint): void;
    center(centerPoint?: GlobalPoint): GlobalPoint | void { } // TODO
    getCorner(point: GlobalPoint): string | undefined {
        return "";
    } // TODO
    visibleInCanvas(canvas: HTMLCanvasElement): boolean {
        return true;
    } // TODO
    snapToGrid(): void { }
    resizeToGrid(): void { }
    resize(resizeDir: string, point: LocalPoint): void { }
}

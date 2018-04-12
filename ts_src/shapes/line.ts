import Shape from "./shape";
import BoundingRect from "./boundingrect";
import { g2lx, g2ly } from "../units";
import { GlobalPoint } from "../geom";

export default class Line extends Shape {
    type = "line";
    endPoint: GlobalPoint;
    constructor(startPoint: GlobalPoint, endPoint: GlobalPoint, uuid?: string) {
        super(startPoint, uuid);
        this.endPoint = endPoint;
    }
    asDict() {
        return Object.assign(this.getBaseDict(), {
            x2: this.endPoint.x,
            y2: this.endPoint.y,
        })
    }
    getBoundingBox(): BoundingRect {
        return new BoundingRect(
            new GlobalPoint(
                Math.min(this.refPoint.x, this.endPoint.x),
                Math.min(this.refPoint.x, this.endPoint.y),
            ),
            Math.abs(this.refPoint.x - this.endPoint.x),
            Math.abs(this.refPoint.y - this.endPoint.y)
        );
    }
    draw(ctx: CanvasRenderingContext2D) {
        super.draw(ctx);
        ctx.beginPath();
        ctx.moveTo(g2lx(this.refPoint.x), g2ly(this.refPoint.y));
        ctx.lineTo(g2lx(this.endPoint.x), g2ly(this.endPoint.y));
        ctx.strokeStyle = 'rgba(255,0,0, 0.5)';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
    contains(point: GlobalPoint): boolean {
        return false; // TODO
    }

    center(): GlobalPoint;
    center(centerPoint: GlobalPoint): void;
    center(centerPoint?: GlobalPoint): GlobalPoint | void { } // TODO
    getCorner(point: GlobalPoint): string|undefined { return "" }; // TODO
    visibleInCanvas(canvas: HTMLCanvasElement): boolean { return true; } // TODO
}
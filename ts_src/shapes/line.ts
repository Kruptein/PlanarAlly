import Shape from "./shape";
import BoundingRect from "./boundingrect";
import { g2lx, g2ly } from "../units";
import { GlobalPoint } from "../geom";

export default class Line extends Shape {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    constructor(x1: number, y1: number, x2: number, y2: number, uuid?: string) {
        super(uuid);
        this.type = "line";
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }
    getBoundingBox(): BoundingRect {
        return new BoundingRect(
            Math.min(this.x1, this.x2),
            Math.min(this.y1, this.y2),
            Math.abs(this.x1 - this.x2),
            Math.abs(this.y1 - this.y2)
        );
    }
    draw(ctx: CanvasRenderingContext2D) {
        super.draw(ctx);
        ctx.beginPath();
        ctx.moveTo(g2lx(this.x1), g2ly(this.y1));
        ctx.lineTo(g2lx(this.x2), g2ly(this.y2));
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
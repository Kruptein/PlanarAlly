import { Shape } from "./shape";
import { BoundingRect } from "./boundingrect";
import { w2lx, w2ly } from "../units";
import { Point } from "../utils";

export class Text extends Shape {
    x: number;
    y: number;
    text: string;
    font: string;
    angle: number;
    constructor(x: number, y: number, text: string, font: string, angle?: number, uuid?: string) {
        super(uuid);
        this.type = "text";
        this.x = x;
        this.y = y;
        this.text = text;
        this.font = font;
        this.angle = angle || 0;
    }
    getBoundingBox(): BoundingRect {
        return new BoundingRect(this.x, this.y, 5, 5); // Todo: fix this bounding box
    }
    draw(ctx: CanvasRenderingContext2D) {
        super.draw(ctx);
        ctx.font = this.font;
        ctx.save();
        ctx.translate(w2lx(this.x), w2ly(this.y));
        ctx.rotate(this.angle);
        ctx.textAlign = "center";
        ctx.fillText(this.text, 0, -5);
        ctx.restore();
    }
    contains(x: number, y: number, inWorldCoord: boolean): boolean {
        return false; // TODO
    }

    center(): Point;
    center(centerPoint: Point): void;
    center(centerPoint?: Point): Point | void { } // TODO
    getCorner(x: number, y:number): string|undefined { return "" }; // TODO
    visibleInCanvas(canvas: HTMLCanvasElement): boolean { return true; } // TODO
}
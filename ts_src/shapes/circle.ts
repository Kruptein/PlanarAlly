import Shape from "./shape";
import BoundingRect from "./boundingrect";
import { w2l, w2lx, w2ly } from "../units";
import { Point } from "../utils";

export default class Circle extends Shape {
    x: number;
    y: number;
    r: number;
    border: string;
    constructor(x: number, y: number, r: number, fill?: string, border?: string, uuid?: string) {
        super(uuid);
        this.type = "circle";
        this.x = x || 0;
        this.y = y || 0;
        this.r = r || 1;
        this.fill = fill || '#000';
        this.border = border || "rgba(0, 0, 0, 0)";
    };
    getBoundingBox(): BoundingRect {
        return new BoundingRect(this.x - this.r, this.y - this.r, this.r * 2, this.r * 2);
    }
    draw(ctx: CanvasRenderingContext2D) {
        super.draw(ctx);
        ctx.beginPath();
        ctx.fillStyle = this.fill;
        const loc = w2l({ x: this.x, y: this.y });
        ctx.arc(loc.x, loc.y, this.r, 0, 2 * Math.PI);
        ctx.fill();
        if (this.border !== "rgba(0, 0, 0, 0)") {
            ctx.beginPath();
            ctx.strokeStyle = this.border;
            ctx.arc(loc.x, loc.y, this.r, 0, 2 * Math.PI);
            ctx.stroke();
        }
    }
    contains(x: number, y: number): boolean {
        return (x - w2lx(this.x)) ** 2 + (y - w2ly(this.y)) ** 2 < this.r ** 2;
    }
    inCorner(x: number, y: number, corner: string) {
        return false; //TODO
    }
    getCorner(x: number, y: number) {
        if (this.inCorner(x, y, "ne"))
            return "ne";
        else if (this.inCorner(x, y, "nw"))
            return "nw";
        else if (this.inCorner(x, y, "se"))
            return "se";
        else if (this.inCorner(x, y, "sw"))
            return "sw";
    }
    center(): Point;
    center(centerPoint: Point): void;
    center(centerPoint?: Point): Point | void {
        if (centerPoint === undefined)
            return { x: this.x, y: this.y };
        this.x = centerPoint.x;
        this.y = centerPoint.y;
    }
    visibleInCanvas(canvas: HTMLCanvasElement): boolean { return true; } // TODO
}
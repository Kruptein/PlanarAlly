import { BoundingRect } from "./boundingrect";
import { l2wx, l2wy, w2lx, w2ly } from "../units";
import { Shape } from "./shape";
import { Point } from "../utils";

export abstract class BaseRect extends Shape {
    x: number;
    y: number;
    w: number;
    h: number;
    constructor(x: number, y: number, w: number, h: number, uuid?: string) {
        super(uuid);
        this.type = "baserect";
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
    getBoundingBox() {
        return new BoundingRect(this.x, this.y, this.w, this.h);
    }
    contains(x: number, y: number, inWorldCoord: boolean): boolean {
        if (inWorldCoord) {
            x = l2wx(x);
            y = l2wy(y);
        }
        return this.x <= x && (this.x + this.w) >= x &&
            this.y <= y && (this.y + this.h) >= y;
    }
    inCorner(x: number, y: number, corner: string) {
        switch (corner) {
            case 'ne':
                return w2lx(this.x + this.w - 3) <= x && x <= w2lx(this.x + this.w + 3) && w2ly(this.y - 3) <= y && y <= w2ly(this.y + 3);
            case 'nw':
                return w2lx(this.x - 3) <= x && x <= w2lx(this.x + 3) && w2ly(this.y - 3) <= y && y <= w2ly(this.y + 3);
            case 'sw':
                return w2lx(this.x - 3) <= x && x <= w2lx(this.x + 3) && w2ly(this.y + this.h - 3) <= y && y <= w2ly(this.y + this.h + 3);
            case 'se':
                return w2lx(this.x + this.w - 3) <= x && x <= w2lx(this.x + this.w + 3) && w2ly(this.y + this.h - 3) <= y && y <= w2ly(this.y + this.h + 3);
            default:
                return false;
        }
    }
    getCorner(x: number, y: number): string|undefined {
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
            return { x: this.x + this.w / 2, y: this.y + this.h / 2 };
        this.x = centerPoint.x - this.w / 2;
        this.y = centerPoint.y - this.h / 2;
    }

    visibleInCanvas(canvas: HTMLCanvasElement): boolean {
        return !(w2lx(this.x) > canvas.width || w2ly(this.y) > canvas.height ||
                    w2lx(this.x + this.w) < 0 || w2ly(this.y + this.h) < 0);
    }
}
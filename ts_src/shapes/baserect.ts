import BoundingRect from "./boundingrect";
import Shape from "./shape";
import { GlobalPoint, Vector } from "../geom";
import { g2lx, g2ly } from "../units";

export default abstract class BaseRect extends Shape {
    w: number;
    h: number;
    constructor(topleft: GlobalPoint, w: number, h: number, uuid?: string) {
        super(uuid);
        this.type = "baserect";
        this.refPoint = topleft;
        this.w = w;
        this.h = h;
    }
    getBoundingBox() {
        return new BoundingRect(this.refPoint, this.w, this.h);
    }
    contains(point: GlobalPoint): boolean {
        return this.refPoint.x <= point.x && (this.refPoint.x + this.w) >= point.x &&
            this.refPoint.y <= point.y && (this.refPoint.y + this.h) >= point.y;
    }
    inCorner(point: GlobalPoint, corner: string) {
        switch (corner) {
            case 'ne':
                return g2lx(this.refPoint.x + this.w - 3) <= point.x && point.x <= g2lx(this.refPoint.x + this.w + 3) && g2ly(this.refPoint.y - 3) <= point.y && point.y <= g2ly(this.refPoint.y + 3);
            case 'nw':
                return g2lx(this.refPoint.x - 3) <= point.x && point.x <= g2lx(this.refPoint.x + 3) && g2ly(this.refPoint.y - 3) <= point.y && point.y <= g2ly(this.refPoint.y + 3);
            case 'sw':
                return g2lx(this.refPoint.x - 3) <= point.x && point.x <= g2lx(this.refPoint.x + 3) && g2ly(this.refPoint.y + this.h - 3) <= point.y && point.y <= g2ly(this.refPoint.y + this.h + 3);
            case 'se':
                return g2lx(this.refPoint.x + this.w - 3) <= point.x && point.x <= g2lx(this.refPoint.x + this.w + 3) && g2ly(this.refPoint.y + this.h - 3) <= point.y && point.y <= g2ly(this.refPoint.y + this.h + 3);
            default:
                return false;
        }
    }
    getCorner(point: GlobalPoint): string|undefined {
        if (this.inCorner(point, "ne"))
            return "ne";
        else if (this.inCorner(point, "nw"))
            return "nw";
        else if (this.inCorner(point, "se"))
            return "se";
        else if (this.inCorner(point, "sw"))
            return "sw";
    }
    center(): GlobalPoint;
    center(centerPoint: GlobalPoint): void;
    center(centerPoint?: GlobalPoint): GlobalPoint | void {
        if (centerPoint === undefined)
            return this.refPoint.add(new Vector<GlobalPoint>({x: this.w/2, y: this.w/2}));
        this.refPoint.x = centerPoint.x - this.w / 2;
        this.refPoint.y = centerPoint.y - this.h / 2;
    }

    visibleInCanvas(canvas: HTMLCanvasElement): boolean {
        return !(g2lx(this.refPoint.x) > canvas.width || g2ly(this.refPoint.y) > canvas.height ||
                    g2lx(this.refPoint.x + this.w) < 0 || g2ly(this.refPoint.y + this.h) < 0);
    }
}
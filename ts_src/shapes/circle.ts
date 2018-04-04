import Shape from "./shape";
import BoundingRect from "./boundingrect";
import { g2l, g2lx, g2ly } from "../units";
import { GlobalPoint } from "../geom";
import { ServerCircle } from "../api_types";

export default class Circle extends Shape {
    type = "circle";
    r: number;
    border: string;
    constructor(center: GlobalPoint, r: number, fill?: string, border?: string, uuid?: string) {
        super(center, uuid);
        this.r = r || 1;
        this.fill = fill || '#000';
        this.border = border || "rgba(0, 0, 0, 0)";
    };
    asDict(): ServerCircle {
        // const base = <ServerCircle>this.getBaseDict();
        // base.r = this.r;
        // base.border = this.border;
        // return base;
        return Object.assign(this.getBaseDict(), {
            r: this.r,
            border: this.border
        });
    }
    fromDict(data: ServerCircle) {
        super.fromDict(data);
        this.r = data.r;
        if(data.border)
            this.border = data.border;
    }
    getBoundingBox(): BoundingRect {
        return new BoundingRect(new GlobalPoint(this.refPoint.x - this.r, this.refPoint.y - this.r), this.r * 2, this.r * 2);
    }
    draw(ctx: CanvasRenderingContext2D) {
        super.draw(ctx);
        ctx.beginPath();
        ctx.fillStyle = this.fill;
        const loc = g2l(this.refPoint);
        ctx.arc(loc.x, loc.y, this.r, 0, 2 * Math.PI);
        ctx.fill();
        if (this.border !== "rgba(0, 0, 0, 0)") {
            ctx.beginPath();
            ctx.strokeStyle = this.border;
            ctx.arc(loc.x, loc.y, this.r, 0, 2 * Math.PI);
            ctx.stroke();
        }
    }
    contains(point: GlobalPoint): boolean {
        return (point.x - this.refPoint.x) ** 2 + (point.y - this.refPoint.y) ** 2 < this.r ** 2;
    }
    inCorner(point: GlobalPoint, corner: string) {
        return false; //TODO
    }
    getCorner(point: GlobalPoint) {
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
            return this.refPoint;
        this.refPoint = centerPoint;
    }
    visibleInCanvas(canvas: HTMLCanvasElement): boolean { return true; } // TODO
}
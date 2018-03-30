import { BaseRect } from "./baserect";
import gameManager from "../planarally";
import { w2l } from "../units";

export class Rect extends BaseRect {
    border: string;
    constructor(x: number, y: number, w: number, h: number, fill?: string, border?: string, uuid?: string) {
        super(x, y, w, h, uuid);
        this.type = "rect";
        this.fill = fill || '#000';
        this.border = border || "rgba(0, 0, 0, 0)";
    }
    draw(ctx: CanvasRenderingContext2D) {
        super.draw(ctx);
        ctx.fillStyle = this.fill;
        const z = gameManager.layerManager.zoomFactor;
        const loc = w2l({ x: this.x, y: this.y });
        ctx.fillRect(loc.x, loc.y, this.w * z, this.h * z);
        if (this.border !== "rgba(0, 0, 0, 0)") {
            ctx.strokeStyle = this.border;
            ctx.strokeRect(loc.x, loc.y, this.w * z, this.h * z);
        }
    }
}
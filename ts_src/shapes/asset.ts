import { BaseRect } from "./baserect";
import gameManager from "../planarally";
import { w2lx, w2ly } from "../units";

export class Asset extends BaseRect {
    img: HTMLImageElement;
    src: string = '';
    constructor(img: HTMLImageElement, x: number, y: number, w: number, h: number, uuid?: string) {
        super(x, y, w, h);
        if (uuid !== undefined) this.uuid = uuid;
        this.type = "asset";
        this.img = img;
    }
    draw(ctx: CanvasRenderingContext2D) {
        super.draw(ctx);
        const z = gameManager.layerManager.zoomFactor;
        ctx.drawImage(this.img, w2lx(this.x), w2ly(this.y), this.w * z, this.h * z);
    }
}
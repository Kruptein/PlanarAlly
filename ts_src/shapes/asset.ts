import BaseRect from "./baserect";
import gameManager from "../planarally";
import { g2lx, g2ly, g2lz } from "../units";
import { GlobalPoint } from "../geom";

export default class Asset extends BaseRect {
    img: HTMLImageElement;
    src: string = '';
    constructor(img: HTMLImageElement, topleft: GlobalPoint, w: number, h: number, uuid?: string) {
        super(topleft, w, h);
        if (uuid !== undefined) this.uuid = uuid;
        this.type = "asset";
        this.img = img;
    }
    draw(ctx: CanvasRenderingContext2D) {
        super.draw(ctx);
        ctx.drawImage(this.img, g2lx(this.refPoint.x), g2ly(this.refPoint.y), g2lz(this.w), g2lz(this.h));
    }
    getInitiativeRepr() {
        return {
            uuid: this.uuid,
            visible: !gameManager.IS_DM,
            group: false,
            src: "",
            owners: this.owners
        }
    }
}
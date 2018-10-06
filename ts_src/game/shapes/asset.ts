import store from "../store";
import BaseRect from "./baserect";

import { InitiativeData, ServerAsset } from "../api_types";
import { GlobalPoint } from "../geom";
import { g2lx, g2ly, g2lz } from "../units";

export default class Asset extends BaseRect {
    type = "asset";
    img: HTMLImageElement;
    src: string = "";
    angle: number = 0;
    constructor(img: HTMLImageElement, topleft: GlobalPoint, w: number, h: number, uuid?: string) {
        super(topleft, w, h);
        if (uuid !== undefined) this.uuid = uuid;
        this.img = img;
    }
    asDict() {
        return Object.assign(this.getBaseDict(), {
            src: this.src,
            angle: this.angle,
        });
    }
    fromDict(data: ServerAsset) {
        super.fromDict(data);
        this.src = data.src;
        if (data.angle !== undefined)
            this.angle = data.angle;
    }
    draw(ctx: CanvasRenderingContext2D) {
        super.draw(ctx);
        try {
            ctx.save();
            const x = g2lx(this.refPoint.x);
            const y = g2ly(this.refPoint.y);
            const w = g2lz(this.w);
            const h = g2lz(this.h);
            ctx.translate(x + (w / 2), y + (h / 2));
            ctx.rotate(this.angle);
            ctx.drawImage(this.img, - (w / 2), - (h / 2), w, h);
            ctx.restore();
        } catch (error) {
            console.warn(`Shape ${this.uuid} could not load the image ${this.src}`);
        }
    }
    getInitiativeRepr(): InitiativeData {
        return {
            uuid: this.uuid,
            visible: !store.state.IS_DM,
            group: false,
            src: this.src,
            owners: this.owners,
            has_img: true,
            effects: [],
        };
    }
}

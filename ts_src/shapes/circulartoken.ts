import Circle from "./circle";
import { GlobalPoint } from "../geom";
import { ServerCircularToken, InitiativeData } from "../api_types";
import { g2l } from "../units";
import Settings from "../settings";
import { calcFontScale } from "../utils";

export default class CircularToken extends Circle {
    type = "circulartoken";
    text: string;
    font: string;
    constructor(center: GlobalPoint, r: number, text: string, font: string, fill?: string, border?: string, uuid?: string) {
        super(center, r, fill, border, uuid);
        this.text = text;
        this.font = font;
    }
    asDict(): ServerCircularToken {
        // const base = <ServerCircle>this.getBaseDict();
        // base.r = this.r;
        // base.border = this.border;
        // return base;
        return Object.assign(this.getBaseDict(), {
            r: this.r,
            text: this.text,
            font: this.font,
            border: this.border
        });
    }
    fromDict(data: ServerCircularToken) {
        super.fromDict(data);
        this.r = data.r;
        this.text = data.text;
        this.font = data.font;
        if (data.border)
            this.border = data.border;
    }
    draw(ctx: CanvasRenderingContext2D) {
        super.draw(ctx);
        ctx.font = this.font;
        ctx.save();
        const dest = g2l(this.center());
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const xs = calcFontScale(ctx, this.text, this.r * Settings.zoomFactor, this.r * Settings.zoomFactor);
        const ys = 0
        ctx.transform(xs, ys, -ys, xs, dest.x, dest.y);
        ctx.fillStyle = tinycolor.mostReadable(this.fill, ['#000', '#fff']).toHexString();
        ctx.fillText(this.text, 0, 0);
        ctx.restore();
    }
    getInitiativeRepr(): InitiativeData {
        return {
            uuid: this.uuid,
            visible: !Settings.IS_DM,
            group: false,
            src: (this.name === '' || this.name === 'Unknown shape') ? this.text : this.name,
            owners: this.owners,
            has_img: false,
            effects: [],
        }
    }
}
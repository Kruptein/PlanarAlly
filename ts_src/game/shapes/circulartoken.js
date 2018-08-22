import Circle from "./circle";
import { g2l, g2lz } from "../units";
import { calcFontScale } from "../../core/utils";
import store from "../store";
export default class CircularToken extends Circle {
    constructor(center, r, text, font, fill, border, uuid) {
        super(center, r, fill, border, uuid);
        this.type = "circulartoken";
        this.text = text;
        this.font = font;
    }
    asDict() {
        return Object.assign(this.getBaseDict(), {
            r: this.r,
            text: this.text,
            font: this.font,
            border: this.border
        });
    }
    fromDict(data) {
        super.fromDict(data);
        this.r = data.r;
        this.text = data.text;
        this.font = data.font;
        if (data.border)
            this.border = data.border;
    }
    draw(ctx) {
        super.draw(ctx);
        ctx.font = this.font;
        ctx.save();
        const dest = g2l(this.center());
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const xs = calcFontScale(ctx, this.text, g2lz(this.r), g2lz(this.r));
        const ys = 0;
        ctx.transform(xs, ys, -ys, xs, dest.x, dest.y);
        ctx.fillStyle = tinycolor.mostReadable(this.fill, ['#000', '#fff']).toHexString();
        ctx.fillText(this.text, 0, 0);
        ctx.restore();
    }
    getInitiativeRepr() {
        return {
            uuid: this.uuid,
            visible: !store.state.IS_DM,
            group: false,
            src: (this.name === '' || this.name === 'Unknown shape') ? this.text : this.name,
            owners: this.owners,
            has_img: false,
            effects: [],
        };
    }
}
//# sourceMappingURL=circulartoken.js.map
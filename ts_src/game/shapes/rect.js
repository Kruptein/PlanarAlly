import BaseRect from "./baserect";
import { g2l } from "../units";
import { getFogColour } from "../utils";
import store from "../store";
export default class Rect extends BaseRect {
    constructor(topleft, w, h, fill, border, uuid) {
        super(topleft, w, h, uuid);
        this.type = "rect";
        this.fill = fill || '#000';
        this.border = border || "rgba(0, 0, 0, 0)";
    }
    asDict() {
        return Object.assign(this.getBaseDict(), {
            border: this.border
        });
    }
    fromDict(data) {
        super.fromDict(data);
        if (data.border)
            this.border = data.border;
    }
    draw(ctx) {
        super.draw(ctx);
        if (this.fill === 'fog')
            ctx.fillStyle = getFogColour();
        else
            ctx.fillStyle = this.fill;
        const z = store.state.zoomFactor;
        const loc = g2l(this.refPoint);
        ctx.fillRect(loc.x, loc.y, this.w * z, this.h * z);
        if (this.border !== "rgba(0, 0, 0, 0)") {
            ctx.strokeStyle = this.border;
            ctx.lineWidth = 5;
            ctx.strokeRect(loc.x, loc.y, this.w * z, this.h * z);
        }
    }
}
//# sourceMappingURL=rect.js.map
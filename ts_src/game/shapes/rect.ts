import store from "../../store";
import BaseRect from "./baserect";

import { GlobalPoint } from "../geom";
import { g2l } from "../units";
import { getFogColour } from "../utils";

export default class Rect extends BaseRect {
    type = "rect";
    constructor(topleft: GlobalPoint, w: number, h: number, fillColour?: string, strokeColour?: string, uuid?: string) {
        super(topleft, w, h, fillColour, strokeColour, uuid);
    }
    asDict() {
        return super.getBaseDict();
    }
    draw(ctx: CanvasRenderingContext2D) {
        super.draw(ctx);
        if (this.fillColour === "fog") ctx.fillStyle = getFogColour();
        else ctx.fillStyle = this.fillColour;
        const z = store.state.game.zoomFactor;
        const loc = g2l(this.refPoint);
        ctx.fillRect(loc.x, loc.y, this.w * z, this.h * z);
        if (this.strokeColour !== "rgba(0, 0, 0, 0)") {
            ctx.strokeStyle = this.strokeColour;
            ctx.lineWidth = 5;
            ctx.strokeRect(loc.x, loc.y, this.w * z, this.h * z);
        }
    }
}

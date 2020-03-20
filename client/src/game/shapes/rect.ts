import { GlobalPoint } from "@/game/geom";
import { BaseRect } from "@/game/shapes/baserect";
import { gameStore } from "@/game/store";
import { g2l } from "@/game/units";
import { getFogColour } from "@/game/utils";
import { ServerShape } from "../comm/types/shapes";

export class Rect extends BaseRect {
    type = "rect";
    constructor(topleft: GlobalPoint, w: number, h: number, fillColour?: string, strokeColour?: string, uuid?: string) {
        super(topleft, w, h, fillColour, strokeColour, uuid);
    }
    asDict(): ServerShape {
        return super.getBaseDict();
    }
    draw(ctx: CanvasRenderingContext2D): void {
        super.draw(ctx);
        if (this.fillColour === "fog") ctx.fillStyle = getFogColour();
        else ctx.fillStyle = this.fillColour;
        const z = gameStore.zoomFactor;
        const loc = g2l(this.refPoint);
        ctx.fillRect(loc.x, loc.y, this.w * z, this.h * z);
        if (this.strokeColour !== "rgba(0, 0, 0, 0)") {
            ctx.strokeStyle = this.strokeColour;
            ctx.lineWidth = 5;
            ctx.strokeRect(loc.x, loc.y, this.w * z, this.h * z);
        }
        super.drawPost(ctx);
    }
}

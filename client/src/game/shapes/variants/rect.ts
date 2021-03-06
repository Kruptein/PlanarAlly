import { GlobalPoint } from "@/game/geom";
import { BaseRect } from "@/game/shapes/variants/baserect";
import { gameStore } from "@/game/store";
import { g2l } from "@/game/units";
import { getFogColour } from "@/game/utils";

import { ServerRect } from "../../models/shapes";
import { SHAPE_TYPE } from "../types";

export class Rect extends BaseRect {
    type: SHAPE_TYPE = "rect";
    constructor(
        topleft: GlobalPoint,
        w: number,
        h: number,
        options?: { fillColour?: string; strokeColour?: string; uuid?: string },
    ) {
        super(topleft, w, h, options);
    }

    asDict(): ServerRect {
        return super.getBaseDict();
    }

    draw(ctx: CanvasRenderingContext2D): void {
        super.draw(ctx);
        if (this.fillColour === "fog") ctx.fillStyle = getFogColour();
        else ctx.fillStyle = this.fillColour;
        const z = gameStore.zoomFactor;
        const loc = g2l(this.refPoint);
        const center = g2l(this.center());
        ctx.fillRect(loc.x - center.x, loc.y - center.y, this.w * z, this.h * z);
        if (this.strokeColour !== "rgba(0, 0, 0, 0)") {
            ctx.strokeStyle = this.strokeColour;
            ctx.lineWidth = this.strokeWidth;
            ctx.strokeRect(loc.x - center.x, loc.y - center.y, this.w * z, this.h * z);
        }

        super.drawPost(ctx);
    }
}

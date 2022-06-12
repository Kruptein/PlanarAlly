import { g2l } from "../../../core/conversions";
import type { GlobalPoint } from "../../../core/geometry";
import { clientStore } from "../../../store/client";
import { getFogColour } from "../../colour";
import type { GlobalId, LocalId } from "../../id";
import type { ServerRect } from "../../models/shapes";
import type { SHAPE_TYPE } from "../types";

import { BaseRect } from "./baseRect";

export class Rect extends BaseRect {
    type: SHAPE_TYPE = "rect";

    constructor(
        topleft: GlobalPoint,
        w: number,
        h: number,
        options?: {
            fillColour?: string;
            strokeColour?: string[];
            id?: LocalId;
            uuid?: GlobalId;
            isSnappable?: boolean;
        },
    ) {
        super(topleft, w, h, options);
    }

    get isClosed(): boolean {
        return true;
    }

    asDict(): ServerRect {
        return super.getBaseDict();
    }

    draw(ctx: CanvasRenderingContext2D): void {
        super.draw(ctx);
        if (this.fillColour === "fog") ctx.fillStyle = getFogColour();
        else ctx.fillStyle = this.fillColour;
        const z = clientStore.zoomFactor.value;
        const loc = g2l(this.refPoint);
        const center = g2l(this.center());
        ctx.fillRect(loc.x - center.x, loc.y - center.y, this.w * z, this.h * z);
        if (this.strokeColour[0] !== "rgba(0, 0, 0, 0)") {
            ctx.strokeStyle = this.strokeColour[0];
            ctx.lineWidth = this.strokeWidth;
            ctx.strokeRect(loc.x - center.x, loc.y - center.y, this.w * z, this.h * z);
        }

        super.drawPost(ctx);
    }
}

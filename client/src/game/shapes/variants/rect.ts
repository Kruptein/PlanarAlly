import { g2l } from "../../../core/conversions";
import { FOG_COLOUR } from "../../colour";
import type { IShape } from "../../interfaces/shape";
import { positionState } from "../../systems/position/state";
import { getProperties } from "../../systems/properties/state";
import type { SHAPE_TYPE } from "../types";

import { BaseRect } from "./baseRect";

export class Rect extends BaseRect implements IShape {
    type: SHAPE_TYPE = "rect";

    readonly isClosed = true;

    draw(ctx: CanvasRenderingContext2D): void {
        super.draw(ctx);
        const props = getProperties(this.id)!;
        if (props.fillColour === "fog") ctx.fillStyle = FOG_COLOUR;
        else ctx.fillStyle = props.fillColour;
        const loc = g2l(this.refPoint);
        const center = g2l(this.center);
        const state = positionState.readonly;
        ctx.fillRect(loc.x - center.x, loc.y - center.y, this.w * state.zoom, this.h * state.zoom);
        if (props.strokeColour[0] !== "rgba(0, 0, 0, 0)") {
            ctx.strokeStyle = props.strokeColour[0]!;
            ctx.lineWidth = this.strokeWidth;
            ctx.strokeRect(loc.x - center.x, loc.y - center.y, this.w * state.zoom, this.h * state.zoom);
        }

        super.drawPost(ctx);
    }
}

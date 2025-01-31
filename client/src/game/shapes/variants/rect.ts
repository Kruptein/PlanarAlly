import { g2l } from "../../../core/conversions";
import { getColour } from "../../colour";
import type { IShape } from "../../interfaces/shape";
import { positionState } from "../../systems/position/state";
import { getProperties } from "../../systems/properties/state";
import type { SHAPE_TYPE } from "../types";

import { BaseRect } from "./baseRect";

export class Rect extends BaseRect implements IShape {
    type: SHAPE_TYPE = "rect";

    readonly isClosed = true;

    draw(ctx: CanvasRenderingContext2D, lightRevealRender: boolean): void {
        super.draw(ctx, lightRevealRender);
        const props = getProperties(this.id)!;

        if (!lightRevealRender) {
            ctx.fillStyle = getColour(props.fillColour, this.id);
        }

        const loc = g2l(this.refPoint);
        const center = g2l(this.center);
        const state = positionState.readonly;
        ctx.fillRect(loc.x - center.x, loc.y - center.y, this.w * state.zoom, this.h * state.zoom);

        if (!lightRevealRender) {
            if (props.strokeColour[0] !== "rgba(0, 0, 0, 0)") {
                ctx.strokeStyle = getColour(props.strokeColour[0]!, this.id);
                ctx.lineWidth = this.strokeWidth;
                ctx.strokeRect(loc.x - center.x, loc.y - center.y, this.w * state.zoom, this.h * state.zoom);
            }
        }

        super.drawPost(ctx, lightRevealRender);
    }
}

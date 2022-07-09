import { g2l } from "../../../core/conversions";
import type { GlobalPoint } from "../../../core/geometry";
import { clientStore } from "../../../store/client";
import { getFogColour } from "../../colour";
import type { GlobalId, LocalId } from "../../id";
import type { ServerRect } from "../../models/shapes";
import { getProperties } from "../../systems/properties/state";
import type { ShapeProperties } from "../../systems/properties/state";
import type { SHAPE_TYPE } from "../types";

import { BaseRect } from "./baseRect";

export class Rect extends BaseRect {
    type: SHAPE_TYPE = "rect";

    constructor(
        topleft: GlobalPoint,
        w: number,
        h: number,
        options?: {
            id?: LocalId;
            uuid?: GlobalId;
            isSnappable?: boolean;
        },
        properties?: Partial<ShapeProperties>,
    ) {
        super(topleft, w, h, options, properties);
    }

    get isClosed(): boolean {
        return true;
    }

    asDict(): ServerRect {
        return super.getBaseDict();
    }

    draw(ctx: CanvasRenderingContext2D): void {
        super.draw(ctx);
        const props = getProperties(this.id)!;
        if (props.fillColour === "fog") ctx.fillStyle = getFogColour();
        else ctx.fillStyle = props.fillColour;
        const z = clientStore.zoomFactor.value;
        const loc = g2l(this.refPoint);
        const center = g2l(this.center());
        ctx.fillRect(loc.x - center.x, loc.y - center.y, this.w * z, this.h * z);
        if (props.strokeColour[0] !== "rgba(0, 0, 0, 0)") {
            ctx.strokeStyle = props.strokeColour[0];
            ctx.lineWidth = this.strokeWidth;
            ctx.strokeRect(loc.x - center.x, loc.y - center.y, this.w * z, this.h * z);
        }

        super.drawPost(ctx);
    }
}

import { g2l, g2lz } from "../../../core/conversions";
import type { GlobalPoint } from "../../../core/geometry";
import { SyncMode } from "../../../core/models/types";
import { calcFontScale, mostReadable } from "../../../core/utils";
import { clientStore } from "../../../store/client";
import { sendCircularTokenUpdate } from "../../api/emits/shape/circularToken";
import { getGlobalId } from "../../id";
import type { GlobalId, LocalId } from "../../id";
import type { ServerCircularToken } from "../../models/shapes";
import type { SHAPE_TYPE } from "../types";

import { Circle } from "./circle";

export class CircularToken extends Circle {
    type: SHAPE_TYPE = "circulartoken";
    text: string;
    font: string;
    constructor(
        center: GlobalPoint,
        r: number,
        text: string,
        font: string,
        options?: {
            fillColour?: string;
            strokeColour?: string[];
            id?: LocalId;
            uuid?: GlobalId;
        },
    ) {
        super(center, r, options);
        this.text = text;
        this.font = font;
        this.name = this.text;
    }

    asDict(): ServerCircularToken {
        return Object.assign(this.getBaseDict(), {
            radius: this.r,
            viewing_angle: this.viewingAngle,
            text: this.text,
            font: this.font,
        });
    }

    fromDict(data: ServerCircularToken): void {
        super.fromDict(data);
        this.r = data.radius;
        this.viewingAngle = data.viewing_angle;
        this.text = data.text;
        this.font = data.font;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        super.draw(ctx);

        const center = g2l(this.center());

        ctx.font = this.font;

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const fontScale = calcFontScale(ctx, this.text, g2lz(this.r - 5));
        const pixelRatio = clientStore.devicePixelRatio.value;
        ctx.setTransform(fontScale, 0, 0, fontScale, center.x * pixelRatio, center.y * pixelRatio);
        ctx.rotate(this.angle);
        ctx.fillStyle = mostReadable(this.fillColour);
        ctx.fillText(this.text, 0, 0);

        super.drawPost(ctx);
    }

    setText(text: string, sync: SyncMode): void {
        this.text = text;
        if (sync !== SyncMode.NO_SYNC) {
            sendCircularTokenUpdate({ uuid: getGlobalId(this.id), text, temporary: sync === SyncMode.TEMP_SYNC });
        }
    }
}

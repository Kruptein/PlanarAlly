import type { ApiCircularTokenShape } from "../../../apiTypes";
import { g2l, g2lz } from "../../../core/conversions";
import type { GlobalPoint } from "../../../core/geometry";
import { SyncMode } from "../../../core/models/types";
import { calcFontScale, mostReadable } from "../../../core/utils";
import { sendCircularTokenUpdate } from "../../api/emits/shape/circularToken";
import { getGlobalId } from "../../id";
import type { GlobalId, LocalId } from "../../id";
import type { IShape } from "../../interfaces/shape";
import { getProperties } from "../../systems/properties/state";
import type { ShapeProperties } from "../../systems/properties/state";
import { playerSettingsState } from "../../systems/settings/players/state";
import type { SHAPE_TYPE } from "../types";

import { Circle } from "./circle";

export class CircularToken extends Circle implements IShape {
    type: SHAPE_TYPE = "circulartoken";
    text: string;
    font: string;
    constructor(
        center: GlobalPoint,
        r: number,
        text: string,
        font: string,
        options?: {
            id?: LocalId;
            uuid?: GlobalId;
        },
        properties?: Partial<ShapeProperties>,
    ) {
        super(center, r, options, { name: text, ...properties });
        this.text = text;
        this.font = font;
    }

    asDict(): ApiCircularTokenShape {
        return {
            ...super.asDict(),
            text: this.text,
            font: this.font,
        };
    }

    fromDict(data: ApiCircularTokenShape): void {
        super.fromDict(data);
        this.r = data.radius;
        this.viewingAngle = data.viewing_angle;
        this.text = data.text;
        this.font = data.font;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        super.draw(ctx);

        const center = g2l(this.center);
        const props = getProperties(this.id)!;

        ctx.font = this.font;

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const fontScale = calcFontScale(ctx, this.text, g2lz(this.r - 5));
        const pixelRatio = playerSettingsState.devicePixelRatio.value;
        ctx.setTransform(fontScale, 0, 0, fontScale, center.x * pixelRatio, center.y * pixelRatio);
        ctx.rotate(this.angle);
        ctx.fillStyle = mostReadable(props.fillColour);
        ctx.fillText(this.text, 0, 0);

        super.drawPost(ctx);
    }

    setText(text: string, sync: SyncMode): void {
        this.text = text;
        const uuid = getGlobalId(this.id);
        if (uuid && sync !== SyncMode.NO_SYNC) {
            sendCircularTokenUpdate({ uuid, text, temporary: sync === SyncMode.TEMP_SYNC });
        }
    }
}

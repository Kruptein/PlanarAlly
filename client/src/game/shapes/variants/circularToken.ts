import type { ApiCircularTokenShape } from "../../../apiTypes";
import { g2l, g2lz } from "../../../core/conversions";
import type { GlobalPoint } from "../../../core/geometry";
import type { GlobalId, LocalId } from "../../../core/id";
import { SyncMode } from "../../../core/models/types";
import { calcFontScale, mostReadable } from "../../../core/utils";
import { sendCircularTokenUpdate } from "../../api/emits/shape/circularToken";
import { getColour } from "../../colour";
import { getGlobalId } from "../../id";
import type { IShape } from "../../interfaces/shape";
import type { ServerShapeOptions } from "../../models/shapes";
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

    fromDict(data: ApiCircularTokenShape, options: Partial<ServerShapeOptions>): void {
        super.fromDict(data, options);
        this.r = data.radius;
        this.viewingAngle = data.viewing_angle;
        this.text = data.text;
        this.font = data.font;
    }

    draw(ctx: CanvasRenderingContext2D, lightRevealRender: boolean): void {
        super.draw(ctx, lightRevealRender);

        if (!lightRevealRender) {
            const center = g2l(this.center);
            const props = getProperties(this.id)!;

            ctx.font = this.font;

            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            const fontScale = calcFontScale(ctx, this.text, g2lz(this.r - 5));
            const pixelRatio = playerSettingsState.devicePixelRatio.value;
            ctx.setTransform(fontScale, 0, 0, fontScale, center.x * pixelRatio, center.y * pixelRatio);
            ctx.rotate(this.angle);
            ctx.fillStyle = mostReadable(getColour(props.fillColour, this.id));
            ctx.fillText(this.text, 0, 0);
        }

        super.drawPost(ctx, lightRevealRender);
    }

    setText(text: string, sync: SyncMode): void {
        this.text = text;
        const uuid = getGlobalId(this.id);
        if (uuid && sync !== SyncMode.NO_SYNC) {
            sendCircularTokenUpdate({ uuid, text, temporary: sync === SyncMode.TEMP_SYNC });
        }
    }
}

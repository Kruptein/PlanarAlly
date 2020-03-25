import * as tinycolor from "tinycolor2";

import { calcFontScale } from "@/core/utils";
import { InitiativeData } from "@/game/comm/types/general";
import { ServerCircularToken } from "@/game/comm/types/shapes";
import { GlobalPoint } from "@/game/geom";
import { Circle } from "@/game/shapes/circle";
import { gameStore } from "@/game/store";
import { g2l, g2lz } from "@/game/units";

export class CircularToken extends Circle {
    type = "circulartoken";
    text: string;
    font: string;
    constructor(
        center: GlobalPoint,
        r: number,
        text: string,
        font: string,
        fillColour?: string,
        strokeColour?: string,
        uuid?: string,
    ) {
        super(center, r, fillColour, strokeColour, uuid);
        this.text = text;
        this.font = font;
    }
    asDict(): ServerCircularToken {
        return Object.assign(this.getBaseDict(), {
            radius: this.r,
            text: this.text,
            font: this.font,
        });
    }
    fromDict(data: ServerCircularToken): void {
        super.fromDict(data);
        this.r = data.radius;
        this.text = data.text;
        this.font = data.font;
    }
    draw(ctx: CanvasRenderingContext2D): void {
        super.draw(ctx);
        ctx.font = this.font;
        ctx.save();
        const dest = g2l(this.center());
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const fontScale = calcFontScale(ctx, this.text, g2lz(this.r - 5));
        ctx.setTransform(fontScale, 0, 0, fontScale, dest.x, dest.y);
        ctx.fillStyle = tinycolor.mostReadable(this.fillColour, ["#000", "#fff"]).toHexString();
        ctx.fillText(this.text, 0, 0);
        ctx.restore();
        super.drawPost(ctx);
    }
    getInitiativeRepr(): InitiativeData {
        return {
            uuid: this.uuid,
            visible: !gameStore.IS_DM,
            group: false,
            source: this.name === "" || this.name === "Unknown shape" ? this.text : this.name,
            // eslint-disable-next-line @typescript-eslint/camelcase
            has_img: false,
            effects: [],
            index: Infinity,
        };
    }
}

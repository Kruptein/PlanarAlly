import * as tinycolor from "tinycolor2";

import { g2l, g2lz } from "../../../core/conversions";
import { GlobalPoint } from "../../../core/geometry";
import { calcFontScale } from "../../../core/utils";
import { gameStore } from "../../../store/game";
import { InitiativeData } from "../../models/general";
import { ServerCircularToken } from "../../models/shapes";
import { SHAPE_TYPE } from "../types";

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
            strokeColour?: string;
            uuid?: string;
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
        ctx.setTransform(fontScale, 0, 0, fontScale, center.x, center.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = tinycolor.mostReadable(this.fillColour, ["#000", "#fff"]).toHexString();
        ctx.fillText(this.text, 0, 0);

        super.drawPost(ctx);
    }
    getInitiativeRepr(): InitiativeData {
        return {
            uuid: this.uuid,
            visible: !gameStore.state.isDm,
            group: false,
            source: this.name === "" || this.name === "Unknown shape" ? this.text : this.name,
            has_img: false,
            effects: [],
            index: Infinity,
        };
    }
}

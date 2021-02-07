import { InitiativeData } from "@/game/comm/types/general";
import { ServerAsset } from "@/game/comm/types/shapes";
import { GlobalPoint } from "@/game/geom";
import { BaseRect } from "@/game/shapes/variants/baserect";
import { gameStore } from "@/game/store";
import { g2l, g2lx, g2ly, g2lz } from "@/game/units";

import { SHAPE_TYPE } from "../types";

export class Asset extends BaseRect {
    type: SHAPE_TYPE = "assetrect";
    img: HTMLImageElement;
    src = "";
    strokeColour = "white";

    constructor(
        img: HTMLImageElement,
        topleft: GlobalPoint,
        w: number,
        h: number,
        options?: { uuid?: string; assetId?: number },
    ) {
        super(topleft, w, h, options);
        this.img = img;
    }

    asDict(): ServerAsset {
        return Object.assign(this.getBaseDict(), {
            src: this.src,
        });
    }

    fromDict(data: ServerAsset): void {
        super.fromDict(data);
        this.src = data.src;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        super.draw(ctx);
        const center = g2l(this.center());
        try {
            ctx.drawImage(
                this.img,
                g2lx(this.refPoint.x) - center.x,
                g2ly(this.refPoint.y) - center.y,
                g2lz(this.w),
                g2lz(this.h),
            );
        } catch (error) {
            console.warn(`Shape ${this.uuid} could not load the image ${this.src}`);
        }
        super.drawPost(ctx);
    }
    getInitiativeRepr(): InitiativeData {
        return {
            uuid: this.uuid,
            visible: !gameStore.IS_DM,
            group: false,
            source: this.src,
            has_img: true,
            effects: [],
            index: Infinity,
        };
    }
}

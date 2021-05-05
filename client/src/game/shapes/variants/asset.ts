import { g2l, g2lx, g2ly, g2lz } from "../../../core/conversions";
import { GlobalPoint } from "../../../core/geometry";
import { ServerAsset } from "../../models/shapes";
import { SHAPE_TYPE } from "../types";

import { BaseRect } from "./baseRect";

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

    get isClosed(): boolean {
        return true;
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
}

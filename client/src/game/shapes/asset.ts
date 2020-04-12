// Developer Note: Rotation
// We only allow 0, 90 ,180 and 270 degrees
// On an Asset, we need to keep the rotationDegrees to ensure the image is drawn correctly
// We change the Height and Width for 90 and 270 rotations so the selection, resize and bisection code still works

import { InitiativeData } from "@/game/comm/types/general";
import { ServerAsset } from "@/game/comm/types/shapes";
import { GlobalPoint } from "@/game/geom";
import { BaseRect } from "@/game/shapes/baserect";
import { gameStore } from "@/game/store";
import { g2lx, g2ly, g2lz } from "@/game/units";

export class Asset extends BaseRect {
    type = "assetrect";
    img: HTMLImageElement;
    src = "";
    strokeColour = "white";

    constructor(img: HTMLImageElement, topleft: GlobalPoint, w: number, h: number, uuid?: string) {
        super(topleft, w, h, undefined, undefined, uuid);
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
        try {
            if (this.rotationDegrees == 0) {
                ctx.drawImage(this.img, g2lx(this.refPoint.x), g2ly(this.refPoint.y), g2lz(this.w), g2lz(this.h));
            } else {
                ctx.save();

                // translate from the center of the image
                ctx.translate(g2lx(this.refPoint.x) + g2lz(this.w) / 2, g2ly(this.refPoint.y) + g2lz(this.h) / 2);

                // rotate the canvas to the specified degrees
                ctx.rotate((this.rotationDegrees * Math.PI) / 180);

                // find the new 0,0 point
                if (this.rotationDegrees == 90 || this.rotationDegrees == 270)
                    ctx.translate(
                        -(g2ly(this.refPoint.y) + g2lz(this.h) / 2),
                        -(g2lx(this.refPoint.x) + g2lz(this.w) / 2),
                    );
                else
                    ctx.translate(
                        -(g2lx(this.refPoint.x) + g2lz(this.w) / 2),
                        -(g2ly(this.refPoint.y) + g2lz(this.h) / 2),
                    );

                // draw the image
                if (this.rotationDegrees == 90 || this.rotationDegrees == 270)
                    ctx.drawImage(this.img, g2ly(this.refPoint.y), g2lx(this.refPoint.x), g2lz(this.h), g2lz(this.w));
                else ctx.drawImage(this.img, g2lx(this.refPoint.x), g2ly(this.refPoint.y), g2lz(this.w), g2lz(this.h));

                // we’re done with the rotating so restore the unrotated context
                ctx.restore();
            }
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
            // eslint-disable-next-line @typescript-eslint/camelcase
            has_img: true,
            effects: [],
            index: Infinity,
        };
    }

    rotate(degrees: number, sync: boolean): void {
        this.rotationDegrees = degrees;
        if (this.rotationDegrees >= 360) this.rotationDegrees = 0;

        const w = this.w;
        this.w = this.h;
        this.h = w;

        super.rotate(degrees, sync);
    }
}

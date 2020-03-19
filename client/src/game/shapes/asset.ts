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
            ctx.drawImage(this.img, g2lx(this.refPoint.x), g2ly(this.refPoint.y), g2lz(this.w), g2lz(this.h));
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
}

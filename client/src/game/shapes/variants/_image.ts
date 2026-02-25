import { g2l, g2lz } from "../../../core/conversions";
import type { GlobalPoint } from "../../../core/geometry";
import type { GlobalId, LocalId } from "../../../core/id";
import { FOG_COLOUR } from "../../colour";
import { getGlobalId } from "../../id";
import { LayerName } from "../../models/floor";
import { accessSystem } from "../../systems/access";
import { floorSystem } from "../../systems/floors";

import { BaseRect } from "./baseRect";

export abstract class IImage extends BaseRect {
    img: HTMLImageElement;
    #loaded: boolean;

    constructor(
        img: HTMLImageElement,
        topleft: GlobalPoint,
        w: number,
        h: number,
        options?: {
            id?: LocalId;
            uuid?: GlobalId;
            loaded?: boolean;
            isSnappable?: boolean;
            parentId?: LocalId;
        },
    ) {
        super(topleft, w, h, { isSnappable: false, ...options }, { strokeColour: ["white"] });
        this.img = img;
        this.#loaded = options?.loaded ?? true;
    }

    readonly isClosed = true;

    setLoaded(): void {
        // Late image loading affects floor lighting
        this.layer?.invalidate(true);

        // invalidate token directions
        if (accessSystem.hasAccessTo(this.id, "vision")) {
            const floor = this.floor;
            if (floor !== undefined) floorSystem.getLayer(floor, LayerName.Draw)?.invalidate(true);
        }

        floorSystem.invalidateLightAllFloors();
        this.#loaded = true;
    }

    resizeH(h: number, keepAspectratio: boolean): void {
        const ar = this.h / this.w;
        this.h = h;
        if (keepAspectratio) this.w = h / ar;
    }

    resizeW(w: number, keepAspectratio: boolean): void {
        const ar = this.h / this.w;
        this.w = w;
        if (keepAspectratio) this.h = w * ar;
    }

    draw(
        ctx: CanvasRenderingContext2D,
        lightRevealRender: boolean,
        customScale?: { center: GlobalPoint; width: number; height: number },
    ): void {
        super.draw(ctx, lightRevealRender, customScale);

        const center = g2l(this.center);
        const rp = g2l(this.refPoint);
        const ogH = g2lz(this.h);
        const ogW = g2lz(this.w);
        const h = customScale ? customScale.height : ogH;
        const w = customScale ? customScale.width : ogW;
        const deltaH = (ogH - h) / 2;
        const deltaW = (ogW - w) / 2;

        if (!this.#loaded || lightRevealRender) {
            if (!lightRevealRender) ctx.fillStyle = FOG_COLOUR;
            ctx.fillRect(rp.x - center.x, rp.y - center.y, w, h);
        } else {
            try {
                ctx.drawImage(this.img, rp.x - center.x + deltaW, rp.y - center.y + deltaH, w, h);
            } catch {
                console.warn(`Shape ${getGlobalId(this.id) ?? "unknown"} could not load the image ${this.img.src}`);
            }
        }

        super.drawPost(ctx, lightRevealRender);
    }

    protected changeImage(src: string): void {
        this.#loaded = false;
        this.img.src = src;
        this.img.onload = () => {
            this.setLoaded();
        };
    }
}

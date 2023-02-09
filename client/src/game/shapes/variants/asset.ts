import { g2l, g2lz } from "../../../core/conversions";
import { toGP } from "../../../core/geometry";
import type { GlobalPoint } from "../../../core/geometry";
import { InvalidationMode, SyncMode } from "../../../core/models/types";
import { sendAssetRectImageChange } from "../../api/emits/shape/asset";
import { FOG_COLOUR } from "../../colour";
import { getGlobalId } from "../../id";
import type { GlobalId, LocalId } from "../../id";
import type { IAsset } from "../../interfaces/shapes/asset";
import { LayerName } from "../../models/floor";
import type { ServerAsset } from "../../models/shapes";
import { loadSvgData } from "../../svg";
import { floorSystem } from "../../systems/floors";
import { getProperties } from "../../systems/properties/state";
import { TriangulationTarget, visionState } from "../../vision/state";
import type { SHAPE_TYPE } from "../types";

import { BaseRect } from "./baseRect";
import { Polygon } from "./polygon";

export class Asset extends BaseRect implements IAsset {
    type: SHAPE_TYPE = "assetrect";
    img: HTMLImageElement;
    src = "";
    #loaded: boolean;

    svgData?: { svg: Node; rp: GlobalPoint; paths?: [number, number][][][] }[];

    constructor(
        img: HTMLImageElement,
        topleft: GlobalPoint,
        w: number,
        h: number,
        options?: { id?: LocalId; uuid?: GlobalId; assetId?: number; loaded?: boolean; isSnappable?: boolean },
    ) {
        super(topleft, w, h, { isSnappable: false, ...options }, { strokeColour: ["white"] });
        this.img = img;
        this.#loaded = options?.loaded ?? true;
    }

    readonly isClosed = true;

    asDict(): ServerAsset {
        return Object.assign(this.getBaseDict(), {
            src: this.src,
        });
    }

    fromDict(data: ServerAsset): void {
        super.fromDict(data);
        this.src = data.src;
    }

    setLoaded(): void {
        // Late image loading affects floor lighting
        this.layer?.invalidate(true);

        // invalidate token directions
        if (getProperties(this.id)?.isToken === true) {
            const floor = this.floor;
            if (floor !== undefined) floorSystem.getLayer(floor, LayerName.Draw)?.invalidate(true);
        }

        floorSystem.invalidateLightAllFloors();
        this.#loaded = true;
    }

    async onLayerAdd(): Promise<void> {
        if (this.options.svgAsset !== undefined && this.svgData === undefined) {
            await this.loadSvgs();
        }
    }

    async loadSvgs(): Promise<void> {
        if (this.options.svgAsset !== undefined) {
            const cover = new Polygon(
                this.refPoint,
                this.points.slice(1).map((p) => toGP(p)),
                { openPolygon: false, isSnappable: false },
            );
            this.layer?.addShape(cover, SyncMode.NO_SYNC, InvalidationMode.NORMAL);
            const svgs = await loadSvgData(`/static/assets/${this.options.svgAsset}`);
            this.svgData = [...svgs.values()].map((svg) => ({ svg, rp: this.refPoint, paths: undefined }));
            const props = getProperties(this.id)!;
            if (props.blocksVision) {
                if (this.floorId !== undefined) visionState.recalculateVision(this.floorId);
                visionState.addToTriangulation({ target: TriangulationTarget.VISION, shape: this.id });
            }
            if (props.blocksMovement) {
                if (this.floorId !== undefined) visionState.recalculateMovement(this.floorId);
                visionState.addToTriangulation({ target: TriangulationTarget.MOVEMENT, shape: this.id });
            }
            this.layer?.removeShape(cover, { sync: SyncMode.NO_SYNC, recalculate: false, dropShapeId: true });
            this.invalidate(false);
        }
    }

    draw(ctx: CanvasRenderingContext2D, customScale?: { center: GlobalPoint; width: number; height: number }): void {
        super.draw(ctx, customScale);
        const center = g2l(this.center);
        const rp = g2l(this.refPoint);
        const ogH = g2lz(this.h);
        const ogW = g2lz(this.w);
        const h = customScale ? customScale.height : ogH;
        const w = customScale ? customScale.width : ogW;
        const deltaH = (ogH - h) / 2;
        const deltaW = (ogW - w) / 2;
        if (!this.#loaded) {
            ctx.fillStyle = FOG_COLOUR;
            ctx.fillRect(rp.x - center.x, rp.y - center.y, w, h);
        } else {
            try {
                ctx.drawImage(this.img, rp.x - center.x + deltaW, rp.y - center.y + deltaH, w, h);
            } catch (error) {
                console.warn(`Shape ${getGlobalId(this.id) ?? "unknown"} could not load the image ${this.src}`);
            }
        }
        super.drawPost(ctx);
    }

    setImage(url: string, sync: boolean): void {
        this.#loaded = false;
        this.src = url;
        this.img.src = url;
        this.img.onload = () => {
            this.setLoaded();
        };
        const uuid = getGlobalId(this.id);
        if (uuid && sync) sendAssetRectImageChange({ uuid, src: url });
    }
}

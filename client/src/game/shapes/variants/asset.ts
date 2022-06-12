import { g2l, g2lx, g2ly, g2lz } from "../../../core/conversions";
import { toGP } from "../../../core/geometry";
import type { GlobalPoint } from "../../../core/geometry";
import { InvalidationMode, SyncMode } from "../../../core/models/types";
import { floorStore } from "../../../store/floor";
import { getFogColour } from "../../colour";
import { getGlobalId } from "../../id";
import type { GlobalId, LocalId } from "../../id";
import type { ServerAsset } from "../../models/shapes";
import { loadSvgData } from "../../svg";
import { TriangulationTarget, visionState } from "../../vision/state";
import type { SHAPE_TYPE } from "../types";

import { BaseRect } from "./baseRect";
import { Polygon } from "./polygon";

export class Asset extends BaseRect {
    type: SHAPE_TYPE = "assetrect";
    img: HTMLImageElement;
    src = "";
    strokeColour = ["white"];
    #loaded: boolean;

    svgData?: { svg: Node; rp: GlobalPoint; paths?: [number, number][][][] }[];

    constructor(
        img: HTMLImageElement,
        topleft: GlobalPoint,
        w: number,
        h: number,
        options?: { id?: LocalId; uuid?: GlobalId; assetId?: number; loaded?: boolean; isSnappable?: boolean },
    ) {
        super(topleft, w, h, { isSnappable: false, ...options });
        this.img = img;
        this.#loaded = options?.loaded ?? true;
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

    setLoaded(): void {
        // Late image loading affects floor lighting
        this.layer.invalidate(true);
        floorStore.invalidateLightAllFloors();
        this.#loaded = true;
    }

    onLayerAdd(): void {
        if (this.options.svgAsset !== undefined && this.svgData === undefined) {
            this.loadSvgs();
        }
    }

    async loadSvgs(): Promise<void> {
        if (this.options.svgAsset !== undefined) {
            const cover = new Polygon(
                this.refPoint,
                this.points.slice(1).map((p) => toGP(p)),
                { openPolygon: false, isSnappable: false },
            );
            this.layer.addShape(cover, SyncMode.NO_SYNC, InvalidationMode.NORMAL);
            const svgs = await loadSvgData(`/static/assets/${this.options.svgAsset}`);
            this.svgData = [...svgs.values()].map((svg) => ({ svg, rp: this.refPoint, paths: undefined }));
            if (this.blocksVision) {
                visionState.recalculateVision(this._floor!);
                visionState.addToTriangulation({ target: TriangulationTarget.VISION, shape: this.id });
            }
            if (this.blocksMovement) {
                visionState.recalculateMovement(this._floor!);
                visionState.addToTriangulation({ target: TriangulationTarget.MOVEMENT, shape: this.id });
            }
            this.layer.removeShape(cover, { sync: SyncMode.NO_SYNC, recalculate: false, dropShapeId: true });
            this.invalidate(false);
        }
    }

    draw(ctx: CanvasRenderingContext2D): void {
        super.draw(ctx);
        const center = g2l(this.center());
        if (!this.#loaded) {
            ctx.fillStyle = getFogColour();
            ctx.fillRect(
                g2lx(this.refPoint.x) - center.x,
                g2ly(this.refPoint.y) - center.y,
                g2lz(this.w),
                g2lz(this.h),
            );
        } else {
            try {
                ctx.drawImage(
                    this.img,
                    g2lx(this.refPoint.x) - center.x,
                    g2ly(this.refPoint.y) - center.y,
                    g2lz(this.w),
                    g2lz(this.h),
                );
            } catch (error) {
                console.warn(`Shape ${getGlobalId(this.id)} could not load the image ${this.src}`);
            }
        }
        super.drawPost(ctx);
    }
}

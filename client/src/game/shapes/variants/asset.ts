import { g2l, g2lx, g2ly, g2lz } from "../../../core/conversions";
import { toGP } from "../../../core/geometry";
import type { GlobalPoint } from "../../../core/geometry";
import { InvalidationMode, SyncMode } from "../../../core/models/types";
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
    strokeColour = "white";

    svgData?: { svg: Node; rp: GlobalPoint; paths?: [number, number][][][] }[];

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
                { openPolygon: false },
            );
            this.layer.addShape(cover, SyncMode.NO_SYNC, InvalidationMode.NORMAL, {
                snappable: false,
            });
            const svgs = await loadSvgData(`/static/assets/${this.options.svgAsset}`);
            this.svgData = [...svgs.values()].map((svg) => ({ svg, rp: this.refPoint, paths: undefined }));
            if (this.blocksVision) {
                visionState.recalculateVision(this._floor!);
                visionState.addToTriangulation({ target: TriangulationTarget.VISION, shape: this.uuid });
            }
            if (this.blocksMovement) {
                visionState.recalculateMovement(this._floor!);
                visionState.addToTriangulation({ target: TriangulationTarget.MOVEMENT, shape: this.uuid });
            }
            this.layer.removeShape(cover, SyncMode.NO_SYNC, false);
            this.invalidate(false);
        }
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

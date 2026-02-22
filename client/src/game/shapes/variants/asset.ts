import type { AssetId } from "../../../assets/models";
import { getImageSrcFromHash } from "../../../assets/utils";
import { toGP } from "../../../core/geometry";
import type { GlobalPoint } from "../../../core/geometry";
import { baseAdjust } from "../../../core/http";
import type { GlobalId, LocalId } from "../../../core/id";
import { map } from "../../../core/iter";
import { InvalidationMode, SyncMode } from "../../../core/models/types";
import { sendAssetRectImageChange } from "../../api/emits/shape/asset";
import { getGlobalId } from "../../id";
import type { IAsset } from "../../interfaces/shapes/asset";
import { loadSvgData } from "../../svg";
import { getProperties } from "../../systems/properties/state";
import { VisionBlock } from "../../systems/properties/types";
import { TriangulationTarget, visionState } from "../../vision/state";
import type { AssetRectCompactCore, CompactShapeCore } from "../transformations";
import type { SHAPE_TYPE } from "../types";

import { IImage } from "./_image";
import { Polygon } from "./polygon";

export class Asset extends IImage implements IAsset {
    type: SHAPE_TYPE = "assetrect";
    assetId: AssetId;
    assetHash: string;

    svgData?: { svg: Node; rp: GlobalPoint; paths?: [number, number][][][] }[];

    constructor(
        img: HTMLImageElement,
        topleft: GlobalPoint,
        w: number,
        h: number,
        assetId: AssetId,
        assetHash: string,
        options?: {
            id?: LocalId;
            uuid?: GlobalId;
            loaded?: boolean;
            isSnappable?: boolean;
            parentId?: LocalId;
        },
    ) {
        super(img, topleft, w, h, { isSnappable: false, ...options });
        this.assetId = assetId;
        this.assetHash = assetHash;
    }

    asCompact(): AssetRectCompactCore {
        return { ...super.asCompact(), assetId: this.assetId, assetHash: this.assetHash };
    }

    fromCompact(core: CompactShapeCore, subShape: AssetRectCompactCore): void {
        super.fromCompact(core, subShape);
        this.assetId = subShape.assetId;
        this.assetHash = subShape.assetHash;
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
            const svgs = await loadSvgData(getImageSrcFromHash(this.options.svgAsset));
            this.svgData = [...map(svgs.values(), (svg) => ({ svg, rp: this.refPoint, paths: undefined }))];
            const props = getProperties(this.id)!;
            if (props.blocksVision !== VisionBlock.No) {
                if (this.floorId !== undefined) visionState.recalculateVision(this.floorId);
                visionState.addToTriangulation({ target: TriangulationTarget.VISION, shape: this.id });
            }
            if (props.blocksMovement) {
                if (this.floorId !== undefined) visionState.recalculateMovement(this.floorId);
                visionState.addToTriangulation({ target: TriangulationTarget.MOVEMENT, shape: this.id });
            }
            this.layer?.removeShape(cover, {
                sync: SyncMode.NO_SYNC,
                recalculate: false,
                dropShapeId: true,
            });
            this.invalidate(false);
        }
    }

    setImage(assetId: AssetId, hash: string, sync: boolean): void {
        this.assetId = assetId;
        this.assetHash = hash;
        this.changeImage(baseAdjust(hash));
        const uuid = getGlobalId(this.id);
        if (uuid && sync) sendAssetRectImageChange({ uuid, assetHash: hash, assetId });
    }
}

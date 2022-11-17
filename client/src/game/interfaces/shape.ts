import type { GlobalPoint, Vector } from "../../core/geometry";
import type { Sync } from "../../core/models/types";
import type { LocalId } from "../id";
import type { Floor, LayerName } from "../models/floor";
import type { ShapeOptions, ServerShape } from "../models/shapes";
import type { SHAPE_TYPE } from "../shapes/types";
import type { BoundingRect } from "../shapes/variants/simple/boundingRect";

import type { Label } from "./label";
import type { ILayer } from "./layer";

export interface SimpleShape {
    get center(): GlobalPoint;
}

export interface IShape extends SimpleShape {
    readonly id: LocalId;
    readonly type: SHAPE_TYPE;

    get points(): [number, number][];
    invalidatePoints(): void;
    resetVisionIteration(): void;

    contains(point: GlobalPoint, nearbyThreshold?: number): boolean;

    snapToGrid(): void;
    resizeToGrid(resizePoint: number, retainAspectRatio: boolean): void;
    resize(resizePoint: number, point: GlobalPoint, retainAspectRatio: boolean): number;

    strokeWidth: number;

    assetId?: number;
    groupId?: string;

    globalCompositeOperation: string;

    labels: Label[];

    badge: number;

    showHighlight: boolean;

    ignoreZoomSize: boolean;

    preventSync: boolean;

    isSnappable: boolean;

    options: Partial<ShapeOptions>;

    __center(): GlobalPoint;
    get center(): GlobalPoint;
    set center(centerPoint: GlobalPoint);

    get isClosed(): boolean;

    get triggersVisionRecalc(): boolean;

    onLayerAdd(): void;

    get visionPolygon(): Path2D;
    _visionBbox: BoundingRect | undefined;

    // POSITION

    get floor(): Floor;
    get layer(): ILayer;
    get refPoint(): GlobalPoint;
    set refPoint(point: GlobalPoint);
    get angle(): number;
    set angle(angle: number);
    setLayer(floor: number, layer: LayerName): void;
    getPositionRepresentation(): { angle: number; points: [number, number][] };
    setPositionRepresentation(position: { angle: number; points: [number, number][] }): void;
    invalidate(skipLightUpdate: boolean): void;
    updateLayerPoints(): void;
    rotateAround(point: GlobalPoint, angle: number): void;
    rotateAroundAbsolute(point: GlobalPoint, angle: number): void;
    getPointIndex(p: GlobalPoint, delta?: number): number;
    getPointOrientation(i: number): Vector;

    // DRAWING

    draw(ctx: CanvasRenderingContext2D, customScale?: { center: GlobalPoint; width: number; height: number }): void;
    drawPost(ctx: CanvasRenderingContext2D): void;
    drawSelection(ctx: CanvasRenderingContext2D): void;

    // VISION

    updateShapeVision(alteredMovement: boolean, alteredVision: boolean): void;

    // BOUNDING BOX

    getAABB(delta?: number): BoundingRect;
    getAuraAABB(): BoundingRect;
    getBoundingBox(delta?: number): BoundingRect;

    // STATE

    asDict(): ServerShape;
    getBaseDict(): ServerShape;
    fromDict(data: ServerShape): void;

    // UTILITY

    visibleInCanvas(max: { w: number; h: number }, options: { includeAuras: boolean }): boolean;

    // GROUP

    setGroupId(groupId: string | undefined, syncTo: Sync): void;

    // EXTRA

    addLabel(label: string, syncTo: Sync): void;
    removeLabel(label: string, syncTo: Sync): void;
}

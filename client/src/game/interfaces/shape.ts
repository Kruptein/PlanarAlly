import type { ApiShape } from "../../apiTypes";
import type { GlobalPoint, Vector } from "../../core/geometry";
import type { GridType } from "../../core/grid";
import type { LocalId } from "../../core/id";
import type { Floor, FloorId, LayerName } from "../models/floor";
import type { ServerShapeOptions, ShapeOptions } from "../models/shapes";
import type { DepShape, SHAPE_TYPE } from "../shapes/types";
import type { BoundingRect } from "../shapes/variants/simple/boundingRect";
import type { CharacterId } from "../systems/characters/models";

import type { ILayer } from "./layer";

export interface SimpleShape {
    get center(): GlobalPoint;
}

export interface IShape extends SimpleShape {
    readonly id: LocalId;
    readonly type: SHAPE_TYPE;

    character: CharacterId | undefined;

    get points(): [number, number][];
    get shadowPoints(): [number, number][];
    invalidatePoints: () => void;
    updatePoints: () => void;
    resetVisionIteration: () => void;

    getSize: (gridType: GridType) => number;

    contains: (point: GlobalPoint, nearbyThreshold?: number) => boolean;

    snapToGrid: () => void;
    resizeToGrid: (resizePoint: number, retainAspectRatio: boolean) => void;
    resize: (resizePoint: number, point: GlobalPoint, retainAspectRatio: boolean) => number;

    strokeWidth: number;

    assetId?: number;

    globalCompositeOperation: string;

    showHighlight: boolean;

    ignoreZoomSize: boolean;

    preventSync: boolean;

    isSnappable: boolean;

    options: Partial<ShapeOptions>;

    __center: () => GlobalPoint;
    get center(): GlobalPoint;
    set center(centerPoint: GlobalPoint);

    get parentId(): LocalId | undefined;
    set parentId(pId: LocalId);

    get isClosed(): boolean;

    get triggersVisionRecalc(): boolean;

    onLayerAdd: () => void;

    get visionPolygon(): Path2D;
    _visionBbox: BoundingRect | undefined;
    _lightBlockingNeighbours: LocalId[];
    _parentId?: LocalId;

    get dependentShapes(): readonly DepShape[];

    // POSITION

    readonly floorId: FloorId | undefined;
    readonly layerName: LayerName | undefined;
    get floor(): Floor | undefined;
    get layer(): ILayer | undefined;
    get refPoint(): GlobalPoint;
    set refPoint(point: GlobalPoint);
    get angle(): number;
    set angle(angle: number);
    setLayer: (floor: FloorId, layer: LayerName) => void;
    getPositionRepresentation: () => { angle: number; points: [number, number][] };
    setPositionRepresentation: (position: { angle: number; points: [number, number][] }) => void;
    invalidate: (skipLightUpdate: boolean) => void;
    rotateAround: (point: GlobalPoint, angle: number) => void;
    rotateAroundAbsolute: (point: GlobalPoint, angle: number) => void;
    getPointIndex: (p: GlobalPoint, delta?: number) => number;
    getPointOrientation: (i: number) => Vector;

    // DRAWING

    draw: (
        ctx: CanvasRenderingContext2D,
        lightRevealRender: boolean,
        customScale?: { center: GlobalPoint; width: number; height: number },
    ) => void;
    drawPost: (ctx: CanvasRenderingContext2D, lightRevealRender: boolean) => void;
    drawSelection: (ctx: CanvasRenderingContext2D) => void;

    // VISION

    updateShapeVision: (alteredMovement: boolean, alteredVision: boolean) => void;

    // BOUNDING BOX

    getAABB: (delta?: number) => BoundingRect;
    getAuraAABB: () => BoundingRect;
    getBoundingBox: (delta?: number) => BoundingRect;

    // STATE

    asDict: () => ApiShape;
    // getSubtypeDict: () => ApiShape["subtype"];
    // eslint-disable-next-line @typescript-eslint/method-signature-style
    fromDict(data: ApiShape, options: Partial<ServerShapeOptions>): void;

    // UTILITY

    visibleInCanvas: (max: { w: number; h: number }, options: { includeAuras: boolean }) => boolean;

    // DEPENDENT SHAPES

    addDependentShape: (depShape: DepShape) => void;
    removeDependentShape: (shapeId: LocalId, options: { dropShapeId: boolean }) => void;
    removeDependentShapes: (options: { dropShapeId: boolean }) => void;
}

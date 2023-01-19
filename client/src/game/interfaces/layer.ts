import type { ApiShape } from "../../apiTypes";
import type { InvalidationMode, SyncMode } from "../../core/models/types";
import type { LocalId } from "../id";
import type { FloorId, LayerName } from "../models/floor";
import type { BoundingRect } from "../shapes/variants/simple/boundingRect";

import type { IShape } from "./shape";

export interface ILayer {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    floor: FloorId;
    isVisionLayer: boolean;
    name: LayerName;
    playerEditable: boolean;
    points: Map<string, Set<LocalId>>;
    selectable: boolean;
    shapeIdsInSector: Set<LocalId>;
    shapesInSector: IShape[];

    get height(): number;
    get isActiveLayer(): boolean;
    get width(): number;

    addShape: (shape: IShape, sync: SyncMode, invalidate: InvalidationMode) => void;
    clear: () => void;
    draw: (doClear?: boolean) => void;
    getShapes: (options: { onlyInView?: boolean; includeComposites: boolean }) => readonly IShape[];
    hide: () => void;
    invalidate: (skipLightUpdate: boolean) => void;
    updateView: () => void;
    waitValid: () => Promise<void>;
    isValid: () => boolean;
    moveShapeOrder: (shape: IShape, destinationIndex: number, sync: SyncMode) => void;
    pushShapes: (...shapes: IShape[]) => void;
    removeShape: (shape: IShape, options: { sync: SyncMode; recalculate: boolean; dropShapeId: boolean }) => boolean;
    resize: (width: number, height: number) => void;
    setServerShapes: (shapes: ApiShape[]) => void;
    setShapes: (...shapes: IShape[]) => void;
    show: () => void;
    size: (options: { includeComposites: boolean }) => number;
    updateSectors: (shapeId: LocalId, aabb: BoundingRect) => void;
}

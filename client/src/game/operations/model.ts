import type { ApiShape } from "../../apiTypes";
import type { GlobalPoint } from "../../core/geometry";
import type { LocalId } from "../id";
import type { LayerName } from "../models/floor";

export type Operation =
    | FloorMoveOperation
    | LayerMoveOperation
    | MovementOperation
    | ResizeOperation
    | RotationOperation
    | ShapeAddOperation
    | ShapeRemoveOperation;

// MOVEMENT
export interface ShapeMovementOperation {
    uuid: LocalId;
    from: [number, number];
    to: [number, number];
}

export interface MovementOperation {
    type: "movement";
    shapes: ShapeMovementOperation[];
}

// RESIZE
interface ResizeOperation {
    type: "resize";
    // shapes: (RectResizeOperation | CircleResizeOperation | PolygonResizeOperation)[];
    uuid: LocalId;
    fromPoint: [number, number];
    toPoint: [number, number];
    resizePoint: number;
    retainAspectRatio: boolean;
}

// ROTATION

export interface ShapeRotationOperation {
    uuid: LocalId;
    from: number;
    to: number;
}

interface RotationOperation {
    type: "rotation";
    shapes: ShapeRotationOperation[];
    center: GlobalPoint;
}

// FLOOR CHANGE

interface FloorMoveOperation {
    type: "floormovement";
    from: number;
    to: number;
    shapes: LocalId[];
}

// LAYER CHANGE

interface LayerMoveOperation {
    type: "layermovement";
    from: LayerName;
    to: LayerName;
    shapes: LocalId[];
}

// SHAPE REMOVE

interface ShapeRemoveOperation {
    type: "shaperemove";
    shapes: ApiShape[];
}

// SHAPE ADD

interface ShapeAddOperation {
    type: "shapeadd";
    shapes: ApiShape[];
}

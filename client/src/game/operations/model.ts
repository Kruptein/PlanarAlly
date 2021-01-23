import { GlobalPoint } from "../geom";

export type Operation = MovementOperation | ResizeOperation | RotationOperation;

// MOVEMENT
export interface ShapeMovementOperation {
    uuid: string;
    from: number[];
    to: number[];
}

export interface MovementOperation {
    type: "movement";
    shapes: ShapeMovementOperation[];
}

// RESIZE
export interface ResizeOperation {
    type: "resize";
    // shapes: (RectResizeOperation | CircleResizeOperation | PolygonResizeOperation)[];
    uuid: string;
    fromPoint: number[];
    toPoint: number[];
    resizePoint: number;
    retainAspectRatio: boolean;
}

// ROTATION

export interface ShapeRotationOperation {
    uuid: string;
    from: number;
    to: number;
}

export interface RotationOperation {
    type: "rotation";
    shapes: ShapeRotationOperation[];
    center: GlobalPoint;
}

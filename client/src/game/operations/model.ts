import { GlobalPoint } from "../geom";

export interface ShapeMovementOperation {
    uuid: string;
    from: number[];
    to: number[];
}

export interface ShapeRotationOperation {
    uuid: string;
    from: number;
    to: number;
}

export interface MovementOperation {
    type: "movement";
    shapes: ShapeMovementOperation[];
}

export interface RotationOperation {
    type: "rotation";
    shapes: ShapeRotationOperation[];
    center: GlobalPoint;
}

export type Operation = MovementOperation | RotationOperation;

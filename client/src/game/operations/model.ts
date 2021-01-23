export interface ShapeMovementOperation {
    uuid: string;
    from: number[];
    to: number[];
}

export interface MovementOperation {
    type: "movement";
    shapes: ShapeMovementOperation[];
}

export type Operation = MovementOperation;

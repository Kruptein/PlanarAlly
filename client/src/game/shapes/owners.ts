import type { LocalId } from "../id";

export interface ShapeOwner {
    shape: LocalId;
    user: string;
    access: ShapeAccess;
}

export interface PartialShapeOwner {
    shape: LocalId;
    user: string;
    access: Partial<ShapeAccess>;
}

export interface ShapeAccess {
    edit: boolean;
    vision: boolean;
    movement: boolean;
}

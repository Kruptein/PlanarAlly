import type { LocalId } from "../../id";

export const DEFAULT_ACCESS_SYMBOL = Symbol();
export type ACCESS_KEY = string | typeof DEFAULT_ACCESS_SYMBOL;
export const DEFAULT_ACCESS: ShapeAccess = {
    edit: false,
    movement: false,
    vision: false,
};

export interface ShapeAccess {
    edit: boolean;
    vision: boolean;
    movement: boolean;
}

export interface ShapeOwner {
    shape: LocalId;
    user: string;
    access: ShapeAccess;
}

export interface ServerShapeAccess {
    edit_access: boolean;
    movement_access: boolean;
    vision_access: boolean;
}

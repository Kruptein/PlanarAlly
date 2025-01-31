import type { LocalId } from "../../../core/id";

export const DEFAULT_ACCESS_SYMBOL = Symbol();
export type ACCESS_KEY = string | typeof DEFAULT_ACCESS_SYMBOL;
export type AccessMap = Map<ACCESS_KEY, ShapeAccess>;
export const DEFAULT_ACCESS: ShapeAccess = {
    edit: false,
    movement: false,
    vision: false,
};

export function isNonDefaultAccessSymbol(s: ACCESS_KEY): s is string {
    return s !== DEFAULT_ACCESS_SYMBOL;
}

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

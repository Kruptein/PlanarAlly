import type { LocalId } from "../../../core/id";

export const ACCESS_LEVELS = ["edit", "vision", "movement"] as const;
export type AccessLevel = (typeof ACCESS_LEVELS)[number];
export type AccessConfig = Record<AccessLevel, boolean>;

export const DEFAULT_ACCESS_SYMBOL = Symbol();
export type ACCESS_KEY = string | typeof DEFAULT_ACCESS_SYMBOL;
export type AccessMap = Map<ACCESS_KEY, AccessConfig>;
export const DEFAULT_ACCESS: AccessConfig = {
    edit: false,
    movement: false,
    vision: false,
};

export function isNonDefaultAccessSymbol(s: ACCESS_KEY): s is string {
    return s !== DEFAULT_ACCESS_SYMBOL;
}

export interface ShapeOwner {
    shape: LocalId;
    user: string;
    access: AccessConfig;
}

export interface ServerShapeAccess {
    edit_access: boolean;
    movement_access: boolean;
    vision_access: boolean;
}

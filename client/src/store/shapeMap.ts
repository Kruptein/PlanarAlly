import type { IShape } from "../game/shapes/interfaces";

export const UuidMap: Map<string, IShape> = new Map();
(window as any).UuidMap = UuidMap;

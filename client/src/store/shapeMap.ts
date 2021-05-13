import { Shape } from "../game/shapes/shape";

export const UuidMap: Map<string, Shape> = new Map();
(window as any).UuidMap = UuidMap;

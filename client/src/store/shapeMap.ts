import type { IShape } from "../game/shapes/interfaces";
import type { LocalId } from "../game/shapes/localId";

export const IdMap: Map<LocalId, IShape> = new Map();
// export const UuidMap: Map<string, IShape> = new Map();

export const UuidToIdMap: Map<string, LocalId> = new Map();

(window as any).IdMap = IdMap;
// (window as any).UuidMap = UuidMap;

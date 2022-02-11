import { uuidv4 } from "../core/utils";

import type { IShape } from "./shapes/interfaces";

export type Global<T> = {
    [key in keyof T]: T[key] extends LocalId ? GlobalId : T[key] extends LocalId[] ? GlobalId[] : T[key];
};
export type GlobalId = string & { __brand: "globalId" };
export type LocalId = number & { __brand: "localId" };

// Array of GlobalId indexed by localId
const uuids: GlobalId[] = [];

const idMap: Map<LocalId, IShape> = new Map();

let lastId = -1;
const freeIds: LocalId[] = [];

function generateId(): LocalId {
    return freeIds.pop() ?? (++lastId as LocalId);
}

export function generateLocalId(shape: IShape, global?: GlobalId): LocalId {
    const local = generateId();
    uuids[local] = global ?? uuidv4();
    idMap.set(local, shape);
    return local;
}

export function dropId(id: LocalId): void {
    delete uuids[id];
    idMap.delete(id);
    freeIds.push(id);
}

export function getGlobalId(local: LocalId): GlobalId {
    return uuids[local];
}

export function getLocalId(global: GlobalId): LocalId | undefined {
    for (const [i, value] of uuids.entries()) {
        if (value === global) return i as LocalId;
    }
}

export function getShape(local: LocalId): IShape | undefined {
    return idMap.get(local);
}

export function getShapeFromGlobal(global: GlobalId): IShape | undefined {
    const local = getLocalId(global);
    return local === undefined ? undefined : getShape(local);
}

export function getAllShapes(): IterableIterator<IShape> {
    return idMap.values();
}

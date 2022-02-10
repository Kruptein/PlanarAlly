export type Global<T> = {
    [key in keyof T]: T[key] extends LocalId ? GlobalId : T[key] extends LocalId[] ? GlobalId[] : T[key];
};
export type GlobalId = string & { __brand: "globalId" };
export type LocalId = number & { __brand: "localId" };

let lastId = -1;
const freeIds: LocalId[] = [];

export function generateId(): LocalId {
    return freeIds.pop() ?? (++lastId as LocalId);
}

export function dropId(id: LocalId): void {
    freeIds.push(id);
}

(window as any).gid = generateId;
(window as any).did = dropId;

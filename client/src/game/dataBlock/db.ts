import type { DeepReadonly } from "vue";

import { socket } from "../api/socket";

import type { DBR, DataBlockSerializer, DbRepr } from "./models";

export class DataBlock<D extends DBR, S extends DBR> {
    #listeners: { source: string; key: keyof D; cb: (value: D[keyof D]) => void }[] = [];
    #serialize: DataBlockSerializer<D, S>["serialize"];

    constructor(readonly repr: DeepReadonly<DbRepr>, private data: D, serializer: DataBlockSerializer<D, S>) {
        this.#serialize = serializer.serialize;
    }

    get<K extends keyof D>(key: K): D[K] {
        return this.data[key];
    }

    set<K extends keyof D>(key: K, value: D[K], sync: boolean): void {
        this.data[key] = value;
        if (sync) this.save();
        for (const listener of this.#listeners) if (listener.key === key) listener.cb(value);
    }

    listen<K extends keyof D>(source: string, key: K, cb: (value: D[K]) => void): void {
        this.#listeners.push({ source, key, cb: cb as (value: D[keyof D]) => void });
    }

    save(): void {
        const data = this.toJson();
        socket.emit("DataBlock.Save", { ...this.repr, data });
    }

    toJson(): string {
        return JSON.stringify(
            [...Object.entries(this.data)].map(([k, v]) => [k, this.#serialize[k]?.(v as D[string])]),
        );
    }
}

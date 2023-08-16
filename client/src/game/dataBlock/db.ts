import type { DeepReadonly } from "vue";

import { socket } from "../api/socket";

import type { DBR, DataBlockSerializer, DbRepr } from "./models";

export class DataBlock<D extends DBR, S extends DBR> {
    #listeners: { source: string; key: keyof D; cb: (value: D[keyof D]) => void }[] = [];
    #serialize: DataBlockSerializer<D, S>["serialize"];
    #existsOnServer = false;

    constructor(
        readonly repr: DeepReadonly<DbRepr>,
        private data: D,
        serializer: DataBlockSerializer<D, S>,
        existsOnServer: boolean,
    ) {
        this.#serialize = serializer.serialize;
        this.#existsOnServer = existsOnServer;
    }

    get existsOnServer(): boolean {
        return this.#existsOnServer;
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
        if (!this.#existsOnServer) {
            console.warn("Attempt to save DB that has not been created on the server yet.");
            return;
        }

        const data = this.toJson();
        socket.emit("DataBlock.Save", { ...this.repr, data });
    }

    async saveOrCreate(): Promise<void> {
        if (this.#existsOnServer) this.save();
        else await this.createOnServer();
    }

    async createOnServer(): Promise<boolean> {
        if (this.#existsOnServer) {
            console.warn("Attempt to create DB on server when it already exists.");
            return false;
        }
        return new Promise<boolean>((resolve, reject) => {
            socket.emit("DataBlock.Create", { ...this.repr, data: this.toJson() }, (success: boolean) => {
                if (success) {
                    this.#existsOnServer = true;
                    resolve(true);
                }
                reject("Failed to create DataBlock");
            });
        });
    }

    toJson(): string {
        return JSON.stringify(
            [...Object.entries(this.data)].map(([k, v]) => [k, this.#serialize?.[k]?.(v as D[string]) ?? v]),
        );
    }
}

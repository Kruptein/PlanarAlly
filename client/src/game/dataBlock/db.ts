import { type DeepReadonly, reactive, type Reactive } from "vue";

import { socket } from "../api/socket";

import type { DBR, DataBlockSerializer, DbRepr } from "./models";

import { parseDataBlockData } from ".";

export class DataBlock<D extends DBR, S extends DBR> {
    #serializer: DataBlockSerializer<D, S>;
    #existsOnServer = false;
    #data: D;
    #reactiveData: Reactive<D> | undefined;

    constructor(
        readonly repr: DeepReadonly<DbRepr>,
        data: D,
        serializer: DataBlockSerializer<D, S>,
        existsOnServer: boolean,
    ) {
        this.#serializer = serializer;
        this.#existsOnServer = existsOnServer;
        this.#data = data;
    }

    get reactiveData(): Reactive<D> {
        if (!this.#reactiveData) this.#reactiveData = reactive(this.#data);
        return this.#reactiveData;
    }

    get existsOnServer(): boolean {
        return this.#existsOnServer;
    }

    get<K extends keyof D>(key: K): D[K] {
        return this.#data[key];
    }

    set<K extends keyof D>(key: K, value: D[K], sync: boolean): void {
        if (this.#reactiveData) {
            (this.#reactiveData.value as D)[key] = value;
        } else {
            this.#data[key] = value;
        }
        if (sync) this.sync();
    }

    sync(createIfMissing = true): void {
        if (this.#existsOnServer) {
            const data = this.toJson();
            socket.emit("DataBlock.Save", { ...this.repr, data });
        } else {
            if (createIfMissing) {
                this.createOnServer();
            } else {
                throw new Error("DataBlock does not exist on server.");
            }
        }
    }

    createOnServer(): void {
        if (this.#existsOnServer) {
            throw new Error("DataBlock already exists on server.");
        }
        socket.emit("DataBlock.Create", { ...this.repr, data: this.toJson() }, (success: boolean) => {
            if (success) {
                this.#existsOnServer = true;
            } else {
                throw new Error("Failed to create DataBlock");
            }
        });
    }

    toJson(): string {
        return JSON.stringify(
            Object.entries(this.#data).map(([k, v]) => [k, this.#serializer.serialize?.[k]?.(v as D[string]) ?? v]),
        );
    }

    loadData(rawData: string): void {
        this.updateData(parseDataBlockData(rawData, this.#serializer));
    }

    updateData(data: D): void {
        if (this.#reactiveData) {
            Object.assign(this.#reactiveData, data);
        } else {
            this.#data = data;
        }
    }
}

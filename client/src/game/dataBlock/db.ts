import { type DeepReadonly, ref, type Ref } from "vue";

import { socket } from "../api/socket";

import type { DBR, DataBlockSerializer, DbRepr } from "./models";

import { parseDataBlockData } from ".";

export type DataBlockOptions<D extends DBR = never, S extends DBR = D> = {
    createOnServer?: boolean;
    defaultData?: () => D;
    updateCallback?: (value: D) => void;
    serializer?: DataBlockSerializer<D, S>;
};

export class DataBlock<D extends DBR = never, S extends DBR = D> {
    #serializer: DataBlockSerializer<D, S> | undefined;
    #existsOnServer: boolean;
    #data: D;
    #reactiveData: Ref<D> | undefined;
    #updateCallback: ((value: D) => void) | undefined;

    constructor(
        readonly repr: DeepReadonly<DbRepr>,
        data: D,
        existsOnServer: boolean,
        options?: Omit<DataBlockOptions<D, S>, "createOnServer">,
    ) {
        this.#data = data;
        this.#serializer = options?.serializer;
        this.#existsOnServer = existsOnServer;
        this.#updateCallback = options?.updateCallback;
    }

    get reactiveData(): Ref<D> {
        if (!this.#reactiveData) this.#reactiveData = ref(this.#data) as Ref<D>;
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
            this.#reactiveData.value[key] = value;
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
        const data = this.#serializer?.serialize(this.#data) ?? this.#data;
        return JSON.stringify(data);
    }

    loadData(rawData: string): void {
        this.updateData(parseDataBlockData(rawData, this.#serializer));
    }

    updateData(data: D): void {
        if (this.#reactiveData) {
            this.#reactiveData.value = data;
        }
        this.#data = data;
        this.#updateCallback?.(data);
    }
}

import { type DeepReadonly, ref, type Ref } from "vue";

import { socket } from "../api/socket";

import type { DBR, DataBlockSerializer, DbRepr } from "./models";

import { parseDataBlockData } from ".";

export type DataBlockOptions<S extends DBR = never, D = S> = {
    createOnServer?: boolean;
    defaultData?: () => D;
    updateCallback?: (value: D) => void;
    serializer?: DataBlockSerializer<S, D>;
};

export class DataBlock<S extends DBR = never, D = S> {
    #serializer: DataBlockSerializer<S, D> | undefined;
    #existsOnServer: boolean;
    #reactiveData: Ref<D> | undefined;
    #updateCallback: ((value: D) => void) | undefined;

    constructor(
        readonly repr: DeepReadonly<DbRepr>,
        public data: D,
        existsOnServer: boolean,
        options?: Omit<DataBlockOptions<S, D>, "createOnServer">,
    ) {
        this.#serializer = options?.serializer;
        this.#existsOnServer = existsOnServer;
        this.#updateCallback = options?.updateCallback;
    }

    get reactiveData(): Ref<D> {
        if (!this.#reactiveData) this.#reactiveData = ref(this.data) as Ref<D>;
        return this.#reactiveData;
    }

    get existsOnServer(): boolean {
        return this.#existsOnServer;
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
        const data = this.#serializer?.serialize(this.data) ?? this.data;
        return JSON.stringify(data);
    }

    // This is an internal API to update the data block to match server state.
    // It is assumed that this is only called when data from the server arrives.
    loadData(rawData: string): void {
        this.updateData(parseDataBlockData(rawData, this.#serializer));
        this.#existsOnServer = true;
    }

    updateData(data: D): void {
        if (this.#reactiveData) {
            this.#reactiveData.value = data;
        }
        this.data = data;
        this.#updateCallback?.(data);
    }
}

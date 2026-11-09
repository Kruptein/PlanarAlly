import { type DeepReadonly, ref, type Ref } from "vue";

import type { ApiDataBlockAccess } from "../../apiTypes";
import { socket } from "../api/socket";

import type { DBR, DataBlockSerializer, DbRepr } from "./models";

import { parseDataBlockData } from ".";

export type DataBlockOptions<S extends DBR = never, D = S> = {
    createOnServer?: boolean;
    defaultData?: () => D;
    updateCallback?: (value: D) => void;
    serializer?: DataBlockSerializer<S, D>;
    // Only used when the DataBlock is created, use `setAccess` to change it afterwards.
    // Not supported for user DataBlocks.
    access?: ApiDataBlockAccess;
};

export class DataBlock<S extends DBR = never, D = S> {
    #serializer: DataBlockSerializer<S, D> | undefined;
    #existsOnServer: boolean;
    #reactiveData: Ref<D> | undefined;
    #updateCallback: ((value: D) => void) | undefined;
    #access: ApiDataBlockAccess | null;

    constructor(
        readonly repr: DeepReadonly<DbRepr>,
        public data: D,
        existsOnServer: boolean,
        options?: Omit<DataBlockOptions<S, D>, "createOnServer">,
    ) {
        this.#serializer = options?.serializer;
        this.#existsOnServer = existsOnServer;
        this.#updateCallback = options?.updateCallback;
        this.#access = options?.access ?? null;
    }

    get reactiveData(): Ref<D> {
        if (!this.#reactiveData) this.#reactiveData = ref(this.data) as Ref<D>;
        return this.#reactiveData;
    }

    get existsOnServer(): boolean {
        return this.#existsOnServer;
    }

    // null is used for user DataBlocks and for DataBlocks that will use the server defaults on creation
    get access(): ApiDataBlockAccess | null {
        return this.#access;
    }

    async setAccess(access: ApiDataBlockAccess): Promise<boolean> {
        if (!this.#existsOnServer) {
            this.#access = access;
            return true;
        }
        const success = await new Promise<boolean>((resolve) => {
            socket.emit("DataBlock.Access.Update", { dataBlock: this.repr, access }, (result: boolean) => {
                resolve(result);
            });
        });
        if (success) this.#access = access;
        return success;
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
        socket.emit(
            "DataBlock.Create",
            { dataBlock: { ...this.repr, data: this.toJson() }, access: this.#access },
            (success: boolean) => {
                if (success) {
                    this.#existsOnServer = true;
                } else {
                    throw new Error("Failed to create DataBlock");
                }
            },
        );
    }

    toJson(): string {
        const data = this.#serializer?.serialize(this.data) ?? this.data;
        return JSON.stringify(data);
    }

    // This is an internal API to update the data block to match server state.
    // It is assumed that this is only called when data from the server arrives.
    loadData(rawData: string, access?: ApiDataBlockAccess | null): void {
        this.updateData(parseDataBlockData(rawData, this.#serializer));
        this.#existsOnServer = true;
        if (access !== undefined) this.#access = access;
    }

    updateData(data: D): void {
        if (this.#reactiveData) {
            this.#reactiveData.value = data;
        }
        this.data = data;
        this.#updateCallback?.(data);
    }
}

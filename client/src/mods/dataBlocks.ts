import { socket } from "../game/api/socket";

type DBR = Record<string, unknown>;

const dataBlocks = new Map<string, DataBlock<DBR, DBR>>();

function getId(source: string, name: string): string {
    return `${source}-${name}`;
}

export class DataBlock<D extends DBR, S extends DBR> {
    #listeners: { source: string; key: keyof D; cb: (value: D[keyof D]) => void }[] = [];
    #serialize: DataBlockSerializer<D, S>["serialize"];

    constructor(
        readonly source: string,
        readonly name: string,
        private data: D,
        serializer: DataBlockSerializer<D, S>,
    ) {
        this.#serialize = serializer.serialize;
    }

    get<K extends keyof D>(key: K): D[K] {
        return this.data[key];
    }

    set<K extends keyof D>(key: K, value: D[K], persist: boolean): void {
        this.data[key] = value;
        // if persist, sync current state to server
        if (persist) this.save();
        for (const listener of this.#listeners) if (listener.key === key) listener.cb(value);
    }

    listen<K extends keyof D>(source: string, key: K, cb: (value: D[K]) => void): void {
        this.#listeners.push({ source, key, cb: cb as (value: D[keyof D]) => void });
    }

    save(): void {
        const data = this.toJson();
        socket.emit("DataBlock.Save", { source: this.source, name: this.name, data });
    }

    toJson(): string {
        return JSON.stringify(
            [...Object.entries(this.data)].map(([k, v]) => [k, this.#serialize[k]?.(v as D[string])]),
        );
    }
}

export interface DataBlockSerializer<T extends DBR, Y extends DBR> {
    serialize: { [key in keyof T & keyof Y]: (data: T[key]) => Y[key] };
    deserialize: { [key in keyof T & keyof Y]: (data: Y[key]) => T[key] };
}

export async function getOrLoadDataBlock<D extends DBR, S extends DBR>(
    source: string,
    name: string,
    serializer: DataBlockSerializer<D, S>,
    defaultData?: () => D,
): Promise<DataBlock<D, S> | undefined> {
    const id = getId(source, name);
    if (dataBlocks.has(id)) {
        return dataBlocks.get(id) as DataBlock<D, S>;
    }
    return await loadDataBlock(source, name, serializer, defaultData);
}

export async function loadDataBlock<D extends DBR, S extends DBR>(
    source: string,
    name: string,
    serializer: DataBlockSerializer<D, S>,
    defaultData?: () => D,
): Promise<DataBlock<D, S> | undefined> {
    const id = getId(source, name);
    if (dataBlocks.has(id)) {
        console.error("DataBlock has already been loaded");
        return undefined;
    }
    const rawDataBlock = await new Promise<{ data: string }>((resolve) => {
        socket.emit("DataBlock.Load", { source, name }, (data: { data: string }) => {
            resolve(data);
        });
    });
    if (rawDataBlock !== undefined) {
        try {
            const strDataBlock = JSON.parse(rawDataBlock.data) as [string, unknown][];
            const dataBlock = {} as D;
            for (const [key, value] of strDataBlock) {
                dataBlock[key as keyof D] = serializer.deserialize[key]!(value as S[string]);
            }
            const db = new DataBlock(source, name, dataBlock, serializer);
            dataBlocks.set(id, db as DataBlock<DBR, DBR>);
            return db;
        } catch {
            throw new Error(`Failed to parse DataBlock ${id}`);
        }
    } else if (defaultData !== undefined) {
        return await createDataBlock(source, name, defaultData(), serializer);
    } else {
        return undefined;
    }
}

export function getDataBlock<D extends DBR, S extends DBR>(source: string, name: string): DataBlock<D, S> | undefined {
    const id = getId(source, name);
    return dataBlocks.get(id) as DataBlock<D, S> | undefined;
}

export async function createDataBlock<D extends DBR, S extends DBR>(
    source: string,
    name: string,
    data: D,
    serializer: DataBlockSerializer<D, S>,
): Promise<DataBlock<D, S>> {
    const id = getId(source, name);
    if (dataBlocks.has(id)) throw new Error(`A DataBlock for ${id} already exists`);

    const db = new DataBlock(source, name, data, serializer);

    await new Promise<boolean>((resolve, reject) => {
        socket.emit(
            "DataBlock.Create",
            { source, name, description: "test", data: db.toJson() },
            (success: boolean) => {
                if (success) resolve(true);
                reject("Failed to create DataBlock");
            },
        );
    });

    dataBlocks.set(id, db as DataBlock<DBR, DBR>);
    return db;
}

import { socket } from "../api/socket";

import { DataBlock } from "./db";
import type { DBR, DataBlockSerializer, DbRepr } from "./models";

const dataBlocks = new Map<string, DataBlock<DBR, DBR>>();

function getId(db: DbRepr): string {
    let special: string;
    if (db.category === "shape") {
        special = db.shape;
    } else {
        special = db.category;
    }
    return `${db.source}-${db.category}-${db.name}-${special}`;
}

// eslint-disable-next-line import/no-unused-modules
export async function getOrLoadDataBlock<D extends DBR, S extends DBR = D>(
    repr: DbRepr,
    serializer: DataBlockSerializer<D, S>,
    options?: { createOnServer?: boolean; defaultData?: () => D },
): Promise<DataBlock<D, S> | undefined> {
    const id = getId(repr);
    if (dataBlocks.has(id)) {
        return dataBlocks.get(id) as DataBlock<D, S>;
    }
    return await loadDataBlock(repr, serializer, options);
}

export function parseDataBlockData<D extends DBR, S extends DBR>(
    rawData: string,
    serializer: DataBlockSerializer<D, S>,
): D {
    const strDataBlock = JSON.parse(rawData) as [string, unknown][];
    const dataBlock = {} as D;
    for (const [key, value] of strDataBlock) {
        dataBlock[key as keyof D] = serializer.deserialize?.[key]?.(value as S[string]) ?? (value as D[string]);
    }
    return dataBlock;
}

// eslint-disable-next-line import/no-unused-modules
export async function loadDataBlock<D extends DBR, S extends DBR = D>(
    repr: DbRepr,
    serializer: DataBlockSerializer<D, S>,
    options?: { createOnServer?: boolean; defaultData?: () => D },
): Promise<DataBlock<D, S> | undefined> {
    const id = getId(repr);
    if (dataBlocks.has(id)) {
        console.error("DataBlock has already been loaded");
        return undefined;
    }
    const rawDataBlock = await new Promise<{ data: string }>((resolve) => {
        socket.emit("DataBlock.Load", repr, (data: { data: string }) => {
            resolve(data);
        });
    });
    if (rawDataBlock !== undefined) {
        try {
            const dataBlockData = parseDataBlockData(rawDataBlock.data, serializer);
            const db = new DataBlock(repr, dataBlockData, serializer, true);
            dataBlocks.set(id, db as DataBlock<DBR, DBR>);
            return db;
        } catch {
            throw new Error(`Failed to parse DataBlock ${id}`);
        }
    } else if (options?.defaultData !== undefined) {
        return createDataBlock(repr, options.defaultData(), serializer, {
            createOnServer: options.createOnServer,
        });
    } else {
        if (options?.createOnServer === true) {
            console.warn("createOnServer was passed without defaultData. This has no effect.");
        }
        return undefined;
    }
}

// eslint-disable-next-line import/no-unused-modules
export function getDataBlock<D extends DBR, S extends DBR = D>(repr: DbRepr): DataBlock<D, S> | undefined {
    const id = getId(repr);
    return dataBlocks.get(id) as DataBlock<D, S> | undefined;
}

// eslint-disable-next-line import/no-unused-modules
export function createDataBlock<D extends DBR, S extends DBR = D>(
    repr: DbRepr,
    data: D,
    serializer: DataBlockSerializer<D, S>,
    options?: { createOnServer?: boolean },
): DataBlock<D, S> {
    const id = getId(repr);
    if (dataBlocks.has(id)) throw new Error(`A DataBlock for ${id} already exists`);

    const db = new DataBlock(repr, data, serializer, false);

    if (options?.createOnServer ?? true) db.createOnServer();

    dataBlocks.set(id, db as DataBlock<DBR, DBR>);
    return db;
}

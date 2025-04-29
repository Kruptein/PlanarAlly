import { socket } from "../api/socket";

import { DataBlock, type DataBlockOptions } from "./db";
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
export async function getOrLoadDataBlock<D extends DBR = never, S extends DBR = D>(
    repr: DbRepr,
    options?: DataBlockOptions<D, S>,
): Promise<DataBlock<D, S> | undefined> {
    const id = getId(repr);
    if (dataBlocks.has(id)) {
        return dataBlocks.get(id) as DataBlock<D, S>;
    }
    return await loadDataBlock(repr, options);
}

export function parseDataBlockData<D extends DBR = never, S extends DBR = D>(
    rawData: string,
    serializer?: DataBlockSerializer<D, S>,
): D {
    const strDataBlock = JSON.parse(rawData) as S;
    return serializer?.deserialize(strDataBlock) ?? (strDataBlock as unknown as D);
}

// eslint-disable-next-line import/no-unused-modules
export async function loadDataBlock<D extends DBR = never, S extends DBR = D>(
    repr: DbRepr,
    options?: DataBlockOptions<D, S>,
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
            const dataBlockData = parseDataBlockData(rawDataBlock.data, options?.serializer);
            const db = new DataBlock(repr, dataBlockData, true, options);
            dataBlocks.set(id, db as DataBlock<DBR, DBR>);
            return db;
        } catch {
            throw new Error(`Failed to parse DataBlock ${id}`);
        }
    } else if (options?.defaultData !== undefined) {
        return createDataBlock(repr, options.defaultData(), options);
    } else {
        if (options?.createOnServer === true) {
            console.warn("createOnServer was passed without defaultData. This has no effect.");
        }
        return undefined;
    }
}

// eslint-disable-next-line import/no-unused-modules
export function getDataBlock<D extends DBR = never, S extends DBR = D>(repr: DbRepr): DataBlock<D, S> | undefined {
    const id = getId(repr);
    return dataBlocks.get(id) as DataBlock<D, S> | undefined;
}

// eslint-disable-next-line import/no-unused-modules
export function createDataBlock<D extends DBR = never, S extends DBR = D>(
    repr: DbRepr,
    data: D,
    options?: DataBlockOptions<D, S>,
): DataBlock<D, S> {
    const id = getId(repr);
    if (dataBlocks.has(id)) throw new Error(`A DataBlock for ${id} already exists`);

    const db = new DataBlock(repr, data, false, options);

    if (options?.createOnServer ?? false) db.createOnServer();

    dataBlocks.set(id, db as DataBlock<DBR, DBR>);
    return db;
}

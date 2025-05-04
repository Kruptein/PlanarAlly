import { socket } from "../api/socket";

import { DataBlock, type DataBlockOptions } from "./db";
import type { DBR, DataBlockSerializer, DbRepr } from "./models";

// Load attempts is a set of ids that were attempted to be loaded without default data.
// To prevent multiple network + database calls when these are requested multiple times,
// we store them in a set and ignore them in all future load calls.
// When a DB save is triggered for one of these, we remove them from the set and assign them to the new data.
const loadAttempts = new Map<string, DataBlockOptions<DBR, DBR>>();
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
export async function getOrLoadDataBlock<S extends DBR = never, D = S>(
    repr: DbRepr,
    options?: DataBlockOptions<S, D>,
): Promise<DataBlock<S, D> | undefined> {
    const id = getId(repr);
    if (dataBlocks.has(id)) {
        return dataBlocks.get(id) as DataBlock<S, D>;
    }
    return await loadDataBlock(repr, options);
}

export function parseDataBlockData<D = never, S extends DBR = D extends DBR ? D : never>(
    rawData: string,
    serializer?: DataBlockSerializer<S, D>,
): D {
    const strDataBlock = JSON.parse(rawData) as S;
    return serializer?.deserialize(strDataBlock) ?? (strDataBlock as unknown as D);
}

// eslint-disable-next-line import/no-unused-modules
export async function loadDataBlock<S extends DBR = never, D = S>(
    repr: DbRepr,
    options?: DataBlockOptions<S, D>,
): Promise<DataBlock<S, D> | undefined> {
    const id = getId(repr);
    if (dataBlocks.has(id)) {
        console.error("DataBlock has already been loaded");
        return undefined;
    }

    let rawDataBlock: { data: string } | undefined;
    if (!loadAttempts.has(id)) {
        rawDataBlock = await new Promise<{ data: string }>((resolve) => {
            socket.emit("DataBlock.Load", repr, (data: { data: string }) => {
                resolve(data);
            });
        });
    }

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
        loadAttempts.set(id, options as DataBlockOptions<DBR, DBR>);
        return undefined;
    }
}

// eslint-disable-next-line import/no-unused-modules
export function getDataBlock<S extends DBR = never, D = S>(repr: DbRepr): DataBlock<S, D> | undefined {
    const id = getId(repr);
    return dataBlocks.get(id) as DataBlock<S, D> | undefined;
}

// eslint-disable-next-line import/no-unused-modules
export function createDataBlock<S extends DBR = never, D = S>(
    repr: DbRepr,
    data: D,
    options?: DataBlockOptions<S, D>,
): DataBlock<S, D> {
    const id = getId(repr);
    if (dataBlocks.has(id)) throw new Error(`A DataBlock for ${id} already exists`);

    const db = new DataBlock(repr, data, false, options);

    if (options?.createOnServer ?? false) db.createOnServer();

    dataBlocks.set(id, db as DataBlock<DBR, DBR>);

    if (loadAttempts.has(id)) {
        loadAttempts.delete(id);
    }

    return db;
}

export function updateDataBlock(repr: DbRepr, rawData: string): void {
    let db: DataBlock<DBR, DBR> | undefined = getDataBlock(repr);
    // If the DB is not known yet, check if it's in the loadAttempts map
    if (db === undefined && loadAttempts.has(getId(repr))) {
        db = new DataBlock(repr, {}, true, {});
    }
    // If the DB is known, update it
    if (db) {
        db.loadData(rawData);
    }
}

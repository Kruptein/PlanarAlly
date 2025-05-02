import type { DistributiveOmit } from "../core/types";
import { createDataBlock, getDataBlock, getOrLoadDataBlock, loadDataBlock } from "../game/dataBlock";
import { useShapeDataBlock } from "../game/dataBlock/hooks";

// Mods cannot access datablocks from other mods directly,
// so we expose a function to the mod API that strips `source` from the DbRepr type
// we however need to splice the correct source in when doing the internal routing,
// which is where this wrapper comes in.
//
// In the future we might want to allow mods accessing other mods' datablocks,
// but even then it would be more ergonomic to give the option to not specify the source
// if it's the mod's own datablock they're accessing.
const wrap = <T, A extends unknown[], U>(fn: (r: T, ...args: A) => U, tag: string) => {
    return (r: DistributiveOmit<T, "source">, ...args: A): U => fn({ ...r, source: tag } as T, ...args);
};

const nameWrap = <T, A extends unknown[], U>(fn: (r: T, ...args: A) => U, tag: string) => {
    return (name: string, ...args: A): U => fn({ name, source: tag } as T, ...args);
};

// Instead we're using these dummy functions to get the proper return types.
const wrappedGetDataBlock = wrap(getDataBlock, "getDataBlock");
const wrappedUseShapeDataBlock = nameWrap(useShapeDataBlock, "useShapeDataBlock");
const wrappedLoadDataBlock = wrap(loadDataBlock, "loadDataBlock");
const wrappedCreateDataBlock = wrap(createDataBlock, "createDataBlock");
const wrappedGetOrLoadDataBlock = wrap(getOrLoadDataBlock, "getOrLoadDataBlock");

export interface ModDataBlockFunctions {
    getOrLoadDataBlock: typeof wrappedGetOrLoadDataBlock;
    loadDataBlock: typeof wrappedLoadDataBlock;
    createDataBlock: typeof wrappedCreateDataBlock;
    getDataBlock: typeof wrappedGetDataBlock;

    useShapeDataBlock: typeof wrappedUseShapeDataBlock;
}

export function getDataBlockFunctions(tag: string): ModDataBlockFunctions {
    return {
        getDataBlock: wrap(getDataBlock, tag) as typeof wrappedGetDataBlock,
        createDataBlock: wrap(createDataBlock, tag),
        loadDataBlock: wrap(loadDataBlock, tag),
        getOrLoadDataBlock: wrap(getOrLoadDataBlock, tag),
        useShapeDataBlock: nameWrap(useShapeDataBlock, tag),
    };
}

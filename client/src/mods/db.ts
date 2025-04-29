import type { DistributiveOmit } from "../core/types";
import { createDataBlock, getDataBlock, getOrLoadDataBlock, loadDataBlock } from "../game/dataBlock";
import { useDataBlock, useShapeDataBlock } from "../game/dataBlock/hooks";

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

// These utility functions sadly lose the <D extends DBR = never, ...> encapsulating generics,
// which means that users cannot declare the actual shape of the data block they're using.
//
// type Wrap<T, A extends unknown[], U> = ReturnType<typeof wrap<T, A, U>>;
// type Wrap2<T extends (...args: any[]) => any> = T extends (r: infer X, ...args: infer A) => infer R
//     ? Wrap<X, A, R>
//     : never;
// type WrappedGetDataBlock = Wrap2<typeof getDataBlock>;

// Instead we're using these dummy functions to get the proper return types.
const wrappedGetDataBlock = wrap(getDataBlock, "getDataBlock");
const wrappedUseDataBlock = wrap(useDataBlock, "useDataBlock");
const wrappedUseShapeDataBlock = nameWrap(useShapeDataBlock, "useShapeDataBlock");
const wrappedLoadDataBlock = wrap(loadDataBlock, "loadDataBlock");
const wrappedCreateDataBlock = wrap(createDataBlock, "createDataBlock");
const wrappedGetOrLoadDataBlock = wrap(getOrLoadDataBlock, "getOrLoadDataBlock");

export interface ModDataBlockFunctions {
    getOrLoadDataBlock: typeof wrappedGetOrLoadDataBlock;
    loadDataBlock: typeof wrappedLoadDataBlock;
    createDataBlock: typeof wrappedCreateDataBlock;
    getDataBlock: typeof wrappedGetDataBlock;

    useDataBlock: typeof wrappedUseDataBlock;
    useShapeDataBlock: typeof wrappedUseShapeDataBlock;
}

export function getDataBlockFunctions(tag: string): ModDataBlockFunctions {
    return {
        getDataBlock: wrap(getDataBlock, tag) as typeof wrappedGetDataBlock,
        createDataBlock: wrap(createDataBlock, tag),
        loadDataBlock: wrap(loadDataBlock, tag),
        getOrLoadDataBlock: wrap(getOrLoadDataBlock, tag),
        useDataBlock: wrap(useDataBlock, tag),
        useShapeDataBlock: nameWrap(useShapeDataBlock, tag),
    };
}

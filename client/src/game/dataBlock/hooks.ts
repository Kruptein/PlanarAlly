import type { Ref } from "vue";
import { ref, shallowReadonly, watch } from "vue";

import type { ApiCoreDataBlock, ApiShapeDataBlock } from "../../apiTypes";
import type { GlobalId } from "../../core/id";
import type { DistributivePick, DistributiveOmit } from "../../core/types";

import type { DataBlockOptions, DataBlock } from "./db";
import type { DbRepr, DBR } from "./models";

import { getOrLoadDataBlock } from ".";

type Normalize<T> = T extends infer S ? { [K in keyof S]: S[K] } : never;
type IsEmptyObject<Obj extends Record<PropertyKey, unknown>> = [keyof Obj] extends [never] ? true : false;
type LoadArg<T extends Record<string, unknown>> =
    IsEmptyObject<T> extends true ? () => Promise<void> : (args: Normalize<T>) => Promise<void>;

export function useDataBlock<
    T extends DbRepr,
    // Core representation without data (source/category/name)
    X extends DistributivePick<T, keyof Omit<ApiCoreDataBlock, "data">>,
    // Specific DataBlock type extracted from the union based on X
    Y extends Extract<T, X>,
    // Fields of Y not listed in X (i.e. the data fields)
    Z extends DistributiveOmit<Y, keyof X>,
    D extends DBR = never,
    S extends DBR = D,
>(
    repr: X,
    options: Partial<DataBlockOptions<D, S>> & { defaultData: () => NoInfer<D> },
): {
    data: Readonly<Ref<D>>;
    load: LoadArg<Z>;
    save: () => void;
    write: (value: D) => void;
} {
    async function load(): Promise<void>;
    async function load(args: Normalize<Z>): Promise<void>;
    async function load(args?: Normalize<Z>): Promise<void> {
        dataBlock = await getOrLoadDataBlock({ ...repr, ...args } as T, options);
        if (dataBlock) {
            internalData.value = dataBlock.reactiveData.value;
            watch(dataBlock.reactiveData, (value) => {
                internalData.value = value;
            });
        } else {
            // notification?
        }
    }

    function write(value: D): void {
        dataBlock?.updateData(value);
    }

    function save(): void {
        dataBlock?.sync?.();
    }

    let dataBlock: DataBlock<D, S> | undefined;
    const internalData = ref(options.defaultData()) as Ref<D>;
    return { data: shallowReadonly(internalData), load, save, write };
}

// A simpler more specialized version of useDataBlock that only deals with shape data blocks
// After spending a lot of time on the generic useDataBlock version, it ultimately is only really relevant for shape data blocks atm
export function useShapeDataBlock<D extends DBR = never, S extends DBR = D>(
    repr: Pick<ApiShapeDataBlock, "name" | "source">,
    options: Partial<DataBlockOptions<D, S>> & { defaultData: () => NoInfer<D> },
): {
    data: Readonly<Ref<D>>;
    load: (shape: GlobalId) => Promise<void>;
    save: () => void;
    write: (value: D) => void;
} {
    async function load(shape: GlobalId): Promise<void> {
        dataBlock = await getOrLoadDataBlock({ ...repr, shape, category: "shape" }, options);
        if (dataBlock) {
            internalData.value = dataBlock.reactiveData.value;
            watch(dataBlock.reactiveData, (value) => {
                internalData.value = value;
            });
        } else {
            // notification?
        }
    }

    function write(value: D): void {
        dataBlock?.updateData(value);
    }

    function save(): void {
        dataBlock?.sync?.();
    }

    let dataBlock: DataBlock<D, S> | undefined;
    const internalData = ref(options.defaultData()) as Ref<D>;
    return { data: shallowReadonly(internalData), load, save, write };
}

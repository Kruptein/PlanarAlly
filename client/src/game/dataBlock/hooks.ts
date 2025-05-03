import type { Ref } from "vue";
import { ref, shallowReadonly, watch } from "vue";

import type { ApiShapeDataBlock } from "../../apiTypes";
import type { GlobalId, LocalId } from "../../core/id";
import { getGlobalId } from "../id";

import type { DataBlockOptions, DataBlock } from "./db";
import type { DBR } from "./models";

import { getOrLoadDataBlock } from ".";

// A simpler more specialized version of useDataBlock that only deals with shape data blocks
// After spending a lot of time on the generic useDataBlock version, it ultimately is only really relevant for shape data blocks atm
export function useShapeDataBlock<S extends DBR = never, D = S>(
    repr: Pick<ApiShapeDataBlock, "name" | "source">,
    options: Partial<DataBlockOptions<S, D>> & { defaultData: () => NoInfer<D> },
): {
    data: Readonly<Ref<D>>;
    load: (shape: GlobalId | LocalId) => Promise<void>;
    save: () => void;
    write: (value: D) => void;
} {
    async function load(shape: GlobalId | LocalId): Promise<void> {
        const shapeId = typeof shape === "string" ? shape : getGlobalId(shape);
        if (shapeId === undefined) throw new Error("Invalid shape ID was passed during datablock loading");

        dataBlock = await getOrLoadDataBlock({ ...repr, shape: shapeId, category: "shape" }, options);
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

    let dataBlock: DataBlock<S, D> | undefined;
    const internalData = ref(options.defaultData()) as Ref<D>;
    return { data: shallowReadonly(internalData), load, save, write };
}

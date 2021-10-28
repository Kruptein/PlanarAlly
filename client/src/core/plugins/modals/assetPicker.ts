import { readonly, reactive, toRefs } from "vue";
import type { DeepReadonly, Ref } from "vue";

import { assetStore } from "../../../assetManager/state";
import type { Asset } from "../../models/types";

export type AssetPickerFunction = () => Promise<DeepReadonly<Asset> | undefined>;

interface AssetPickerModal {
    visible: DeepReadonly<Ref<boolean>>;
    close: () => void;
    show: AssetPickerFunction;
    submit: () => void;
}

export function useAssetPicker(): AssetPickerModal {
    const data = reactive({
        visible: false,
    });

    let resolve: (inode: DeepReadonly<Asset> | undefined) => void = (_inode: DeepReadonly<Asset> | undefined) => {};

    async function show(): Promise<DeepReadonly<Asset> | undefined> {
        data.visible = true;
        return new Promise((res) => (resolve = res));
    }

    function submit(): void {
        const selected = assetStore.state.selected;
        if (selected.length !== 1) {
            resolve(undefined);
        } else {
            const asset = assetStore.state.idMap.get(selected[0]);
            resolve(asset);
        }
        data.visible = false;
    }

    function close(): void {
        resolve(undefined);
        data.visible = false;
    }

    const refs = { ...toRefs(data) };
    return { show, close, submit, visible: readonly(refs.visible) };
}

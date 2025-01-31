import type { Ref } from "vue";
import { ref } from "vue";

const showAssetContextMenu = ref(false);
const assetContextLeft = ref(0);
const assetContextTop = ref(0);

function openAssetContextMenu(event: MouseEvent): void {
    showAssetContextMenu.value = true;
    assetContextLeft.value = event.clientX;
    assetContextTop.value = event.clientY;
}

export interface AssetContextMenu {
    state: {
        readonly visible: Ref<boolean>;
        readonly left: Ref<number>;
        readonly top: Ref<number>;
    };
    open: (event: MouseEvent) => void;
    close: () => void;
}

export function useAssetContextMenu(): AssetContextMenu {
    return {
        state: {
            visible: showAssetContextMenu,
            left: assetContextLeft,
            top: assetContextTop,
        },
        open: openAssetContextMenu,
        close: () => (showAssetContextMenu.value = false),
    };
}

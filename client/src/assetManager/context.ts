import { ref } from "vue";

export const showAssetContextMenu = ref(false);
export const assetContextLeft = ref(0);
export const assetContextTop = ref(0);

export function openAssetContextMenu(event: MouseEvent): void {
    showAssetContextMenu.value = true;
    assetContextLeft.value = event.pageX;
    assetContextTop.value = event.pageY;
}

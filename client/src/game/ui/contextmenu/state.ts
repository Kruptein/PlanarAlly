import { ref } from "vue";

export const showDefaultContextMenu = ref(false);
export const defaultContextLeft = ref(0);
export const defaultContextTop = ref(0);

export function openDefaultContextMenu(event: MouseEvent): void {
    showDefaultContextMenu.value = true;
    defaultContextLeft.value = event.pageX;
    defaultContextTop.value = event.pageY;
}

export const showShapeContextMenu = ref(false);
export const shapeContextLeft = ref(0);
export const shapeContextTop = ref(0);

export function openShapeContextMenu(event: MouseEvent): void {
    showShapeContextMenu.value = true;
    shapeContextLeft.value = event.pageX;
    shapeContextTop.value = event.pageY;
}

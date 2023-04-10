import { ref } from "vue";

export const tokenDialogVisible = ref(false);
export let tokenDialogLeft = 0;
export let tokenDialogTop = 0;

export function openCreateTokenDialog(data: { x: number; y: number }): void {
    tokenDialogVisible.value = true;
    tokenDialogLeft = data.x;
    tokenDialogTop = data.y;
}

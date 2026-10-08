import { ref } from "vue";

export const compendiumOpen = ref(false);

export function toggleCompendium(): void {
    compendiumOpen.value = !compendiumOpen.value;
}

export function closeCompendium(): void {
    compendiumOpen.value = false;
}

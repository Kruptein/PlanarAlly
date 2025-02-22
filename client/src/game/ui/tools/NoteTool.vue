<script setup lang="ts">
import { computed, onBeforeMount, ref, toRef } from "vue";
import { useI18n } from "vue-i18n";

import { ToolName } from "../../models/tools";
import { noteSystem } from "../../systems/notes";
import { noteState } from "../../systems/notes/state";
import { selectedState } from "../../systems/selected/state";
import { activateTool, activeTool } from "../../tools/tools";

const { t } = useI18n();

const emit = defineEmits<(e: "return") => void>();

const previousTool = ref<ToolName | null>(null);

const selectedShape = toRef(selectedState.reactive, "focus");

onBeforeMount(() => {
    previousTool.value = activeTool.value;
    activateTool(ToolName.Note);
});

const shapeAlreadyHooked = computed(() => {
    const note = noteState.reactive.currentNote;
    const shape = selectedShape.value;
    if (note === undefined || shape === undefined) {
        return false;
    }
    return noteState.reactive.shapeNotes.get1(shape)?.includes(note) ?? false;
});

function close(): void {
    activateTool(previousTool.value ?? ToolName.Select);
    emit("return");
}

function attach(): void {
    const note = noteState.raw.currentNote;
    const shape = selectedShape.value;
    if (shape !== undefined && note !== undefined) {
        noteSystem.attachShape(note, shape, true);
    }
    close();
}
</script>

<template>
    <div id="note-pin-helper">
        <header>{{ t("game.ui.tools.NoteTool.header") }}</header>
        <div>{{ t("game.ui.tools.NoteTool.line1") }}</div>
        <div>{{ t("game.ui.tools.NoteTool.line2") }}</div>
        <div style="margin-top: 1rem; display: flex; justify-content: flex-end">
            <div v-show="shapeAlreadyHooked" style="color: red">Shape already attached.</div>
            <button
                style="margin-right: 0.5rem"
                :disabled="selectedShape === undefined || shapeAlreadyHooked"
                @click="attach"
            >
                {{ t("common.confirm") }}
            </button>
            <button @click="close">{{ t("common.cancel") }}</button>
        </div>
    </div>
</template>

<style scoped lang="scss">
#note-pin-helper {
    position: absolute;
    right: 1.5rem;
    bottom: 9rem;

    pointer-events: auto;

    padding: 2rem;
    border-radius: 1rem;

    background-color: white;

    header {
        margin-bottom: 1rem;
        font-weight: bold;
    }

    button:hover {
        cursor: pointer;
    }
}
</style>

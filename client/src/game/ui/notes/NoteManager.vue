<script setup lang="ts">
import { computed } from "vue";

import { modalSystem } from "../../systems/modals";
import type { ModalIndex } from "../../systems/modals/types";
import { noteState } from "../../systems/notes/state";

import NoteEdit from "./NoteEdit.vue";
import NoteList from "./NoteList.vue";

const props = defineProps<{ modalIndex: ModalIndex }>();
defineExpose({ close });

const mode = computed(() => noteState.reactive.managerMode);

function setMode(modeType: typeof mode.value): void {
    if (modeType === "list") {
        noteState.mutableReactive.currentNote = undefined;
    }
    noteState.mutableReactive.managerMode = modeType;
}

function close(): void {
    noteState.mutableReactive.managerOpen = false;
    modalSystem.close(props.modalIndex, true);
}
</script>

<template>
    <div id="notes-container">
        <div id="notes">
            <font-awesome-icon id="close-notes" :icon="['far', 'window-close']" @click="close" />
            <NoteList v-if="mode === 'list'" @edit-note="setMode('edit')" />
            <NoteEdit v-else-if="mode === 'edit'" @mode="setMode($event)" />
        </div>
    </div>
</template>

<style lang="scss">
#notes-container {
    position: absolute;
    display: grid;
    justify-items: center;
    padding-top: 10vh;
    align-items: start;
    width: 100vw;
    height: 100vh;
}

#notes {
    position: relative;
    display: flex;
    flex-direction: column;

    padding: 1.5rem 2rem;
    border-radius: 1rem;
    max-height: 80vh;
    width: 60vw;

    background-color: white;

    pointer-events: all;

    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);

    font-family: "HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande",
        sans-serif;

    #close-notes {
        position: absolute;

        top: 0.75rem;
        right: 0.75rem;

        font-size: 1.25rem;
    }
}
</style>
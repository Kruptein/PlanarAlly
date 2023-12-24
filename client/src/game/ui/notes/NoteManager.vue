<script setup lang="ts">
import { computed } from "vue";

import { noteState } from "../../systems/notes/state";
import { NoteManagerMode } from "../../systems/notes/types";
import { closeNoteManager } from "../../systems/notes/ui";

import NoteEdit from "./NoteEdit.vue";
import NoteList from "./NoteList.vue";

defineExpose({ close });

const mode = computed(() => noteState.reactive.managerMode);

function setMode(modeType: NoteManagerMode): void {
    if (modeType === NoteManagerMode.List) {
        noteState.mutableReactive.currentNote = undefined;
    }
    noteState.mutableReactive.managerMode = modeType;
}

function close(): void {
    closeNoteManager();
}
</script>

<template>
    <div id="notes-container">
        <div id="notes">
            <font-awesome-icon id="close-notes" :icon="['far', 'window-close']" @click="close" />
            <NoteList v-if="mode === NoteManagerMode.List" @edit-note="setMode(NoteManagerMode.Edit)" />
            <NoteEdit v-else-if="mode === NoteManagerMode.Edit" @mode="setMode($event)" />
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

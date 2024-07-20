<script setup lang="ts">
import { computed } from "vue";

import type { ModalIndex } from "../../systems/modals/types";
import { noteState } from "../../systems/notes/state";
import { NoteManagerMode } from "../../systems/notes/types";
import { closeNoteManager } from "../../systems/notes/ui";
import NoteTool from "../tools/NoteTool.vue";

import NoteCreate from "./NoteCreate.vue";
import NoteEdit from "./NoteEdit.vue";
import NoteList from "./NoteList.vue";

const emit = defineEmits<(e: "close" | "focus") => void>();
defineExpose({ close });
defineProps<{ modalIndex: ModalIndex }>();

const mode = computed(() => noteState.reactive.managerMode);

function setMode(modeType: NoteManagerMode): void {
    if (modeType === NoteManagerMode.List) {
        noteState.mutableReactive.currentNote = undefined;
    }
    noteState.mutableReactive.managerMode = modeType;
}

function close(): void {
    closeNoteManager();
    emit("close");
}
</script>

<template>
    <div v-show="noteState.reactive.managerOpen && mode !== NoteManagerMode.AttachShape" id="notes-container">
        <div id="notes" @click="$emit('focus')">
            <font-awesome-icon id="close-notes" :icon="['far', 'window-close']" @click="close" />
            <KeepAlive>
                <NoteList v-if="mode === NoteManagerMode.List" @mode="setMode($event)" />
                <NoteCreate v-else-if="mode === NoteManagerMode.Create" @mode="setMode($event)" />
                <NoteEdit v-else-if="mode === NoteManagerMode.Edit" @mode="setMode($event)" />
            </KeepAlive>
        </div>
    </div>
    <NoteTool v-if="mode === NoteManagerMode.AttachShape" @return="setMode(NoteManagerMode.Edit)" />
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

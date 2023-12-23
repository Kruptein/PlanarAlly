<script setup lang="ts">
import { computed } from "vue";

import { noteState } from "../../../systems/notes/state";
import { popoutNote } from "../../../systems/notes/ui";
import { selectedState } from "../../../systems/selected/state";

const id = computed(() => selectedState.reactive.focus);

const notes = computed(() => {
    if (id.value === undefined) return [];
    return noteState.reactive.shapeNotes.get(id.value)?.map((note) => noteState.reactive.notes.get(note)!) ?? [];
});
</script>

<template>
    <div class="panel restore-panel">
        <div class="spanrow header">Notes</div>
        <div v-for="note of notes" :key="note.uuid">
            <div>{{ note.title }}</div>
            <font-awesome-icon icon="up-right-from-square" title="Pop-out" @click="popoutNote(note.uuid)" />
        </div>
    </div>
</template>

<style scoped>
.panel {
    grid-template-columns: [name] 1fr [edit] 30px [move] 30px [vision] 30px [remove] 30px [end];
    grid-column-gap: 5px;
    align-items: center;
    padding-bottom: 1em;
}
</style>

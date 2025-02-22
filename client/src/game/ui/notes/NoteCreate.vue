<script setup lang="ts">
import { onDeactivated, ref } from "vue";
import { useI18n } from "vue-i18n";

import type { ApiNote } from "../../../apiTypes";
import { uuidv4 } from "../../../core/utils";
import { coreStore } from "../../../store/core";
import { noteSystem } from "../../systems/notes";
import { noteState } from "../../systems/notes/state";
import { NoteManagerMode } from "../../systems/notes/types";
import { locationSettingsState } from "../../systems/settings/location/state";

const emit = defineEmits<(e: "mode", mode: NoteManagerMode) => void>();

const { t } = useI18n();

const title = ref("");
const isLocal = ref(true);

onDeactivated(() => {
    title.value = "";
    isLocal.value = true;
});

async function createNote(): Promise<void> {
    const uuid = uuidv4();
    const note: ApiNote = {
        uuid,
        creator: coreStore.state.username,
        title: title.value || "New note...",
        text: "",
        showOnHover: false,
        showIconOnShape: false,
        isRoomNote: isLocal.value,
        location: isLocal.value ? locationSettingsState.reactive.activeLocation : null,
        tags: [],
        access: [],
        shapes: [],
    };
    await noteSystem.newNote(note, true);
    if (noteState.raw.shapeFilter) noteSystem.attachShape(uuid, noteState.raw.shapeFilter, true);

    noteState.mutableReactive.currentNote = note.uuid;
    emit("mode", NoteManagerMode.Edit);
}
</script>

<template>
    <header>
        <span id="return" title="Back to list" @click="$emit('mode', NoteManagerMode.List)">↩</span>
        {{ t("game.ui.notes.NoteCreate.header") }}
    </header>
    <div id="create-note">
        <label for="new-note-title">{{ t("game.ui.notes.NoteCreate.title") }}</label>
        <input
            id="new-note-title"
            v-model="title"
            type="text"
            :placeholder="t('game.ui.notes.NoteCreate.title_placeholder')"
            autofocus
        />
        <label for="new-note-type">{{ t("game.ui.notes.NoteCreate.type") }}</label>
        <div @click="isLocal = true">
            <input type="radio" name="new-note-type" value="local" :checked="isLocal" />
            <div>
                <div>{{ t("game.ui.notes.NoteCreate.local_note_title") }}</div>
                <div>
                    {{ t("game.ui.notes.NoteCreate.local_note_body") }}
                </div>
            </div>
        </div>
        <div @click="isLocal = false">
            <input type="radio" name="new-note-type" value="global" :checked="!isLocal" />
            <div>
                <div>{{ t("game.ui.notes.NoteCreate.global_note_title") }}</div>
                <div>
                    {{ t("game.ui.notes.NoteCreate.global_note_body") }}
                </div>
            </div>
        </div>
        <button @click="createNote">{{ t("game.ui.menu.MenuBar.create_note") }}</button>
    </div>
</template>

<style scoped lang="scss">
header {
    display: flex;
    font-size: 1.75em;
    align-items: center;

    #return {
        margin-right: 1rem;

        &:hover {
            cursor: pointer;
            font-weight: bold;
        }
    }

    #title {
        flex-grow: 1;
        margin-right: 1rem;
        border: none;
        border-bottom: solid 1px black;
        font-weight: bold;
        font-size: inherit;
        padding: 0.5rem;

        &.edit:hover {
            cursor: text;
        }
    }
}

#create-note {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    column-gap: 1rem;
    row-gap: 1rem;

    margin-top: 1rem;

    > label {
        font-weight: bold;
    }

    > input {
        border-radius: 1rem;
        padding: 0.5rem 1rem;
        border-style: solid;
    }

    > div {
        grid-column: 1/-1;
        display: flex;

        padding: 1rem;

        border: solid 1px black;

        &:hover {
            cursor: pointer;
        }

        &:first-of-type {
            border-top-left-radius: 1rem;
            border-top-right-radius: 1rem;
            margin-bottom: -1rem; // offset row-gap
            border-bottom: none;
        }

        &:last-of-type {
            border-bottom-left-radius: 1rem;
            border-bottom-right-radius: 1rem;
        }

        > div {
            display: flex;
            flex-direction: column;

            margin-left: 1rem;

            > div:first-of-type {
                font-weight: bold;
            }
        }
    }

    button {
        background-color: lightblue;
        border: solid 2px lightblue;
        border-width: 1px;
        border-radius: 1rem;
        padding: 0.5rem 0.75rem;

        grid-column: 1/-1;

        width: 10rem;

        &:hover {
            cursor: pointer;
            background-color: rgba(173, 216, 230, 0.5);
        }
    }
}
</style>

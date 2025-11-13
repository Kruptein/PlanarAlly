<script setup lang="ts">
import { onDeactivated, ref } from "vue";
import { useI18n } from "vue-i18n";

import type { ApiNote, ApiNoteRoom } from "../../../apiTypes";
import { uuidv4 } from "../../../core/utils";
import { coreStore } from "../../../store/core";
import { gameState } from "../../systems/game/state";
import { noteSystem } from "../../systems/notes";
import { noteState } from "../../systems/notes/state";
import { type NoteId, NoteManagerMode } from "../../systems/notes/types";
import { locationSettingsState } from "../../systems/settings/location/state";

const emit = defineEmits<(e: "mode", mode: NoteManagerMode) => void>();

const { t } = useI18n();

enum NoteLinkType {
    Campaign,
    Location,
    NoLink,
}

const title = ref("");
const noteLinkType = ref(NoteLinkType.Campaign);

onDeactivated(() => {
    title.value = "";
    noteLinkType.value = NoteLinkType.Campaign;
});

const roomLinkOptions = [
    {
        title: t("game.ui.notes.NoteCreate.campaign_note_title"),
        body: t("game.ui.notes.NoteCreate.campaign_note_body"),
        value: NoteLinkType.Campaign,
    },
    {
        title: t("game.ui.notes.NoteCreate.location_note_title"),
        body: t("game.ui.notes.NoteCreate.location_note_body"),
        value: NoteLinkType.Location,
    },
    {
        title: t("game.ui.notes.NoteCreate.no_link_note_title"),
        body: t("game.ui.notes.NoteCreate.no_link_note_body"),
        value: NoteLinkType.NoLink,
    },
];

async function createNote(): Promise<void> {
    const uuid = uuidv4() as unknown as NoteId;
    const [roomCreator, ...roomName] = gameState.fullRoomName.value.split("/") as [string, string[]];
    const rooms: ApiNoteRoom[] = [];
    if (noteLinkType.value !== NoteLinkType.NoLink) {
        rooms.push({
            roomCreator,
            roomName: roomName.join("/"),
            locationId:
                noteLinkType.value === NoteLinkType.Location ? locationSettingsState.reactive.activeLocation : null,
            locationName: null,
        });
    }
    const note: ApiNote = {
        uuid,
        creator: coreStore.state.username,
        title: title.value || "New note...",
        text: "",
        showOnHover: false,
        showIconOnShape: false,
        rooms,
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
        <div>{{ t("game.ui.notes.NoteCreate.type_description") }}</div>
        <div v-for="option of roomLinkOptions" :key="option.value" class="option" @click="noteLinkType = option.value">
            <input type="radio" name="new-note-type" value="local" :checked="noteLinkType === option.value" />
            <div>
                <div>{{ option.title }}</div>
                <div>
                    {{ option.body }}
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

    > .option {
        grid-column: 1/-1;
        display: flex;

        padding: 1rem;
        border: solid 1px black;

        &:hover {
            cursor: pointer;
        }

        &:not(:nth-last-child(1 of .option)),
        &:nth-child(1 of .option) {
            margin-bottom: -1rem; // offset row-gap
            border-bottom: none;
        }

        &:nth-child(1 of .option) {
            border-top-left-radius: 1rem;
            border-top-right-radius: 1rem;
        }

        &:nth-last-child(1 of .option) {
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

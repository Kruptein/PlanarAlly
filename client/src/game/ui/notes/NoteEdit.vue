<script setup lang="ts">
import { computed, onBeforeMount, ref } from "vue";
import VueMarkdown from "vue-markdown-render";

import { useModal } from "../../../core/plugins/modals/plugin";
import { mostReadable } from "../../../core/utils";
import { coreStore } from "../../../store/core";
import { modalSystem } from "../../systems/modals";
import { noteSystem } from "../../systems/notes";
import { noteState } from "../../systems/notes/state";
import { type ClientNote, NoteManagerMode } from "../../systems/notes/types";
import { playerState } from "../../systems/players/state";

import NoteDialog from "./NoteDialog.vue";

const emit = defineEmits<(e: "mode", mode: NoteManagerMode) => void>();

const modals = useModal();

const note = computed(() => noteState.reactive.notes.get(noteState.reactive.currentNote!));
const canEdit = computed(() => {
    if (!note.value) return false;
    const username = coreStore.state.username;
    if (note.value.creator === username) return true;
    return note.value.access.some((a) => a.name === username && a.can_edit);
});

const tabs = computed(
    () =>
        [
            {
                label: "view",
                icon: "eye",
                visible: true,
            },
            { label: "edit", icon: "pencil", visible: canEdit.value },
            { label: "access", icon: "cog", visible: canEdit.value },
            { label: "map", icon: "location-dot", visible: false },
        ] as const,
);
const activeTab = ref(0);

// Ensure that defaultAccess is always first
// and that defaultAccess is provided even if it has no DB value
const accessLevels = computed(() => {
    const access = [];
    let defaultAccess = { name: "default", can_view: false, can_edit: false };
    for (const a of note.value?.access ?? []) {
        if (a.name === "default") defaultAccess = a;
        else access.push(a);
    }
    return [defaultAccess, ...access];
});

onBeforeMount(() => {
    if (noteState.reactive.currentNote === undefined) emit("mode", NoteManagerMode.List);
    if ((note.value?.text ?? "").trim().length === 0) activeTab.value = 1;
});

function setTitle(event: Event): void {
    if (!note.value) return;
    noteSystem.setTitle(note.value.uuid, (event.target as HTMLInputElement).value, true);
}

function setText(event: Event, sync: boolean): void {
    if (!note.value) return;
    noteSystem.setText(note.value.uuid, (event.target as HTMLTextAreaElement).value, sync, !sync);
}

async function addTag(): Promise<void> {
    if (!note.value) return;
    const answer = await modals.prompt("Enter the name of the tag to add.", "New tag");
    if (answer !== undefined && answer.length > 0) await noteSystem.addTag(note.value.uuid, answer, true);
}

function removeTag(tag: string): void {
    if (!note.value || !canEdit.value) return;
    noteSystem.removeTag(note.value.uuid, tag, true);
}

function popout(): void {
    if (!note.value) return;
    modalSystem.addModal({
        component: NoteDialog,
        props: { uuid: note.value.uuid },
    });
}

async function remove(): Promise<void> {
    if (!note.value) return;
    const answer = await modals.confirm("Delete note", "Are you sure you want to delete this note?");
    if (answer === true) {
        noteSystem.removeNote(note.value.uuid, true);
        emit("mode", NoteManagerMode.List);
    }
}

function setViewAccess(access: ClientNote["access"][number], event: MouseEvent): void {
    if (!note.value) return;
    const checked = (event.target as HTMLInputElement).checked;
    noteSystem.setAccess(note.value.uuid, access.name, { can_view: checked, can_edit: false }, true);
}

function setEditAccess(access: ClientNote["access"][number], event: MouseEvent): void {
    if (!note.value) return;
    const checked = (event.target as HTMLInputElement).checked;
    noteSystem.setAccess(
        note.value.uuid,
        access.name,
        { can_view: checked ? true : access.can_view, can_edit: checked },
        true,
    );
}

async function addAccess(): Promise<void> {
    if (!note.value) return;
    const players = playerState.raw.players;
    const selection = await modals.selectionBox(
        "Select a player",
        [...players.values()].map((p) => p.name).filter((p) => note.value?.access.some((a) => a.name === p) !== true),
        { multiSelect: true },
    );
    if (selection === undefined) return;

    for (const s of selection) {
        noteSystem.addAccess(note.value.uuid, s, { can_view: true, can_edit: false }, true);
    }
}
</script>

<template>
    <template v-if="note">
        <header>
            <span id="return" title="Back to list" @click="$emit('mode', NoteManagerMode.List)">↩</span>
            <input
                id="title"
                type="text"
                :value="note?.title ?? 'New note...'"
                :disabled="!canEdit"
                :class="{ edit: canEdit }"
                @change="setTitle"
            />
            <font-awesome-icon v-if="note.shapes.length > 0" icon="location-dot" />
            <font-awesome-icon icon="up-right-from-square" title="Popout note" @click="popout" />
            <font-awesome-icon v-if="canEdit" title="Remove note" icon="trash-alt" @click="remove" />
        </header>
        <!-- TAGS -->
        <div v-if="note.tags.length > 0 || canEdit" id="tags">
            <div
                v-for="tag of note.tags"
                :key="tag.name"
                class="tag"
                :class="{ edit: canEdit }"
                :style="{ color: mostReadable(tag.colour), backgroundColor: tag.colour }"
                @click="removeTag(tag.name)"
            >
                {{ tag.name }}
            </div>
            <div v-if="note.tags.length === 0">No tags yet.</div>
            <div v-if="canEdit" title="Add tag" @click="addTag"><font-awesome-icon icon="plus" /></div>
        </div>
        <!-- TABS -->
        <div v-if="canEdit" id="tabs">
            <div
                v-for="(tab, i) of tabs"
                :key="tab.label"
                :class="{ active: activeTab === i }"
                :style="{ display: tab.visible ? 'flex' : 'none' }"
                @click="activeTab = i"
            >
                <font-awesome-icon :icon="tab.icon" />
                <div>{{ tab.label }}</div>
            </div>
            <!-- <div v-if="canHaveShape(note)">
                <font-awesome-icon icon="location-dot" />
                <div class="note-setting-title">Map Link</div>
                <-- <div v-if="hasShape(note)">
                    <div>Linked to map.</div>
                    <div style="font-weight: bold; text-decoration: underline; font-style: italic">Remove link</div>
                </div>
                <div v-else>
                    <span>This note is not linked to a map location.</span>
                    <span id="link-to-map" @click="$emit('mode', 'map')">Link to map</span>
                </div> --
            </div> -->
        </div>
        <div v-if="tabs[activeTab]!.label === 'view'" id="editor">
            <VueMarkdown :source="note.text" :options="{ html: true }" />
        </div>
        <div v-else-if="tabs[activeTab]!.label === 'edit'" id="editor">
            <i>This input is markdown aware!</i>
            <textarea :value="note.text" @input="setText($event, false)" @change="setText($event, true)"></textarea>
        </div>
        <div v-else id="note-access-container">
            <div>Name</div>
            <div>Can view</div>
            <div>Can edit</div>
            <div></div>
            <template v-for="access of accessLevels" :key="access.name">
                <div>{{ access.name }}</div>
                <input type="checkbox" :checked="access.can_view" @click="setViewAccess(access, $event)" />
                <input type="checkbox" :checked="access.can_edit" @click="setEditAccess(access, $event)" />
                <font-awesome-icon
                    v-if="access.name !== 'default'"
                    icon="trash-alt"
                    title="Remove access"
                    @click="noteSystem.removeAccess(note.uuid, access.name, true)"
                />
                <div v-else></div>
            </template>
            <div @click="addAccess">Add</div>
        </div>
    </template>
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

    svg {
        margin-right: 0.5rem;
        font-size: 0.75em;

        &:last-child {
            margin-right: 1rem;
        }
    }
}

#tags {
    margin: 1rem;
    display: flex;

    > div {
        position: relative;
        padding: 0.25rem 0.5rem;
        border-radius: 1rem;
        margin-right: 0.5rem;

        &.edit.tag:hover {
            cursor: pointer;

            &::after {
                content: "\00D7";
                position: absolute;
                color: red;
                font-size: 20px;
                font-weight: bold;
                cursor: pointer;
                top: -8px;
                right: -4px;
                pointer-events: auto;
            }
        }
    }
}

#note-access {
    border-color: bisque;
    background-color: rgba(255, 228, 196, 0.25);
}

#note-access-container {
    display: grid;
    max-width: 60%;
    grid-template-columns: auto repeat(2, 5rem) 1rem;

    border: solid 1px black;
    padding: 1rem;
    border-radius: 1rem;
    overflow: hidden;
    justify-items: center;

    > :not(:nth-child(4) ~ div) {
        font-weight: bold;
        border-bottom: solid 1px black;
        margin-bottom: 0.5rem;
    }

    > :nth-child(4n-3) {
        justify-self: flex-start;
    }

    > :last-child {
        margin-top: 0.5rem;
        font-style: italic;

        &:hover {
            cursor: pointer;
            font-weight: bold;
        }
    }
}

#note-location-settings {
    border-color: lightblue;
    background-color: rgba(173, 216, 230, 0.25);

    #link-to-map {
        margin-left: 1rem;
        text-decoration: underline;

        &:hover {
            cursor: pointer;
        }
    }
}

#tabs {
    display: flex;
    margin-bottom: 1rem;

    > div {
        display: flex;
        align-items: center;

        margin-left: 0.5rem;
        padding: 0.75rem;
        border: solid 2px lightblue;
        border-radius: 1rem;
        background-color: rgba(173, 216, 230, 0.25);

        &.active,
        &:hover {
            background-color: rgba(255, 228, 196, 0.25);
        }

        &:hover {
            cursor: pointer;
        }

        > svg {
            margin-right: 0.5rem;
            grid-area: icon;
        }

        > div {
            grid-area: title;
            font-weight: bold;
        }
    }
}

#editor {
    border: solid 1px black;
    padding: 1rem;
    border-radius: 1rem;
    min-height: 30vh;

    overflow: auto;

    > i {
        display: block;
        margin-bottom: 0.5rem;
    }

    > textarea {
        width: 100%;
        min-height: inherit;
        padding: 0.5rem;
        font-size: 1.2em;
    }
}
</style>

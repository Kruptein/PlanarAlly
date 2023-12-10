<script setup lang="ts">
import { computed, ref } from "vue";

import type { ApiCampaignNote, ApiCoreNote, ApiLocationNote } from "../../../apiTypes";
import ToggleGroup from "../../../core/components/ToggleGroup.vue";
import { filter } from "../../../core/iter";
import { mostReadable, uuidv4 } from "../../../core/utils";
import { coreStore } from "../../../store/core";
import { modalSystem } from "../../systems/modals";
import { noteSystem } from "../../systems/notes";
import { noteState } from "../../systems/notes/state";
import { locationSettingsState } from "../../systems/settings/location/state";
import NoteDialog from "../NoteDialog.vue";

import { noteTypes } from "./types";
import { hasShape } from "./utils";

const emit = defineEmits<(e: "edit-note" | "create-note") => void>();

const searchBar = ref<HTMLInputElement | null>(null);
const selectedNoteTypes = ref<(typeof noteTypes)[number][]>([]);
const searchFilter = ref("");
const searchInText = ref(false);
const showSearchFilters = ref(false);

// this is probably disruptive if you quickly open with N and expect to close it with N again ?
// onMounted(() => {
//     searchBar.value?.focus();
// });

const visibleNotes = computed(() => {
    const sf = searchFilter.value.trim().toLowerCase();
    const sit = searchInText.value;
    const filterNoteTypes = ![0, noteTypes.length].includes(selectedNoteTypes.value.length);
    return [
        ...filter(noteState.reactive.notes.values(), (note) => {
            if (filterNoteTypes && !selectedNoteTypes.value.includes(note.kind)) return false;
            if (sf.length !== 0) {
                return (
                    note.title.toLowerCase().includes(sf) ||
                    note.tags.some((tag) => tag.name.toLowerCase().includes(sf)) ||
                    (sit ? note.text.toLowerCase().includes(sf) : false)
                );
            }
            return true;
        }),
    ];
});

async function createNote(kind: "campaign" | "location"): Promise<void> {
    const uuid = uuidv4();
    const coreNote: ApiCoreNote = {
        title: "New note...",
        tags: [],
        text: "",
        access: [],
        owner: coreStore.state.username,
        uuid,
    };
    let note: ApiCampaignNote | ApiLocationNote;
    if (kind === "campaign") {
        note = { ...coreNote, kind };
    } else {
        note = { ...coreNote, kind, location: locationSettingsState.raw.activeLocation };
    }
    await noteSystem.newNote(note, true);
    editNote(note.uuid);
}

function editNote(noteId: string): void {
    noteState.mutableReactive.currentNote = noteId;
    emit("edit-note");
}

function popout(noteId: string): void {
    modalSystem.addModal({
        component: NoteDialog,
        props: { uuid: noteId },
    });
}
</script>

<template>
    <header>
        <div>NOTES</div>
    </header>
    <div id="notes-search">
        <div>
            <ToggleGroup
                id="kind-selector"
                v-model="selectedNoteTypes"
                :options="noteTypes"
                :multi-select="true"
                active-color="rgba(173, 216, 230, 0.5)"
            />
            <font-awesome-icon icon="magnifying-glass" @click="searchBar?.focus()" />
            <input ref="searchBar" v-model="searchFilter" type="text" placeholder="search through your notes.." />
            <div id="search-icons">
                <font-awesome-icon
                    icon="sliders"
                    :style="{ opacity: showSearchFilters ? 1 : 0.5 }"
                    @click="showSearchFilters = !showSearchFilters"
                />
            </div>
        </div>
        <div v-show="showSearchFilters">
            <div style="flex-grow: 1"></div>
            <div id="notes-search-filters">
                <div>
                    <label for="onlyActiveLocation">Only show in active location</label>
                    <input id="onlyActiveLocation" type="checkbox" />
                </div>
                <div>
                    <label for="includeNoteText">Also search in text</label>
                    <input id="includeNoteText" v-model="searchInText" type="checkbox" />
                </div>
            </div>
        </div>
    </div>
    <template v-if="visibleNotes.length === 0">
        <div id="no-notes">
            <template v-if="noteState.reactive.notes.size === 0">You don't have any notes yet!</template>
            <template v-else>You have no notes that match this filter.</template>
        </div>
    </template>
    <template v-else>
        <div id="notes-table">
            <div class="header">NAME</div>
            <div class="header">OWNER</div>
            <div class="header">KIND</div>
            <div class="header">TAGS</div>
            <div class="header">ACTIONS</div>
            <template v-for="note of visibleNotes" :key="note.title">
                <div class="title" @click="editNote(note.uuid)">{{ note.title }}</div>
                <div>{{ note.owner === coreStore.state.username ? 'you' : note.owner }}</div>
                <div class="kind">{{ note.kind }}</div>
                <div class="note-tags">
                    <div
                        v-for="tag of note.tags"
                        :key="tag.name"
                        :style="{ color: mostReadable(tag.colour), backgroundColor: tag.colour }"
                    >
                        {{ tag.name }}
                    </div>
                </div>
                <div class="note-actions">
                    <font-awesome-icon icon="pencil" title="Edit" @click="editNote(note.uuid)" />
                    <font-awesome-icon v-if="hasShape(note)" icon="location-dot" title="Go to location" />
                    <font-awesome-icon
                        v-else
                        icon="location-dot"
                        title="This note does not have a location"
                        class="lowOpacity"
                    />
                    <font-awesome-icon icon="up-right-from-square" title="Pop-out" @click="popout(note.uuid)" />
                </div>
            </template>
        </div>
    </template>
    <footer>
        <div style="flex-grow: 1"></div>
        <div id="new-note-selector">
            <div>New note:</div>
            <div id="selector-options">
                <div @click="createNote('campaign')">Campaign</div>
                <div @click="createNote('location')">Location</div>
            </div>
        </div>
    </footer>
</template>

<style scoped lang="scss">
header {
    position: relative;
    display: flex;

    > :first-child {
        flex-grow: 1;
        margin-right: 1rem;
        border-bottom: solid 1px black;
        font-weight: bold;
        font-size: 1.75em;
    }
}

#notes-search {
    margin: 1rem 0;

    > div {
        position: relative;
        display: flex;
        align-items: center;
        overflow: hidden;

        > svg {
            position: absolute;
            margin-left: 16.5rem;
        }

        > input {
            padding: 0.5rem 1rem;
            padding-left: 18rem;
            flex-grow: 1;
            margin-right: 0.5rem;
            border-radius: 1rem;
            border-color: black;

            font-size: 1.25em;
        }

        > #kind-selector {
            position: absolute;
            height: 100%;
            border-color: black;
        }

        > #search-icons {
            position: absolute;
            display: flex;
            right: 1.5rem;
        }
    }

    #notes-search-filters {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        margin-top: 0.5rem;

        > div {
            display: flex;
            align-items: center;

            margin-bottom: 0.5rem;
        }
    }
}

#no-notes {
    font-style: italic;
    display: flex;
    justify-content: center;
}

#notes-table {
    display: grid;
    grid-template-columns: 1fr auto auto minmax(5rem, auto) auto;
    column-gap: 1rem;
    row-gap: 0.5rem;
    align-items: center;
    overflow-y: auto;

    .title {
        font-size: 1.25em;
        padding: 0.5rem 1rem;

        border-radius: 1rem;

        &:hover {
            cursor: pointer;
            background-color: lightblue;
        }
    }

    .header {
        position: sticky;
        top: 0;
        border-bottom: solid 1px black;
        background-color: white;

        &:first-child {
            margin-left: 1rem;
        }
    }

    .kind {
        padding: 0.25rem 0.5rem;
        background-color: lightcoral;
        border-radius: 0.25rem;
    }

    .note-tags {
        display: flex;

        > div {
            background-color: orange;
            padding: 0.25rem 0.5rem;
            border-radius: 0.5rem;
            margin-right: 0.5rem;
        }
    }

    .note-actions {
        display: flex;

        > * {
            margin-right: 0.5rem;

            &:hover {
                cursor: pointer;
            }

            &.lowOpacity {
                opacity: 0.25;

                &:hover {
                    cursor: not-allowed;
                }
            }
        }
    }
}

footer {
    display: flex;
    margin-top: 2rem;

    #new-note-selector {
        display: flex;
        align-items: center;

        background-color: lightblue;
        border: solid 2px lightblue;
        border-radius: 1rem;

        overflow: hidden;

        > div:first-child {
            padding: 0.5rem 0.75rem;
            margin-left: 0.5rem;
        }

        > div:last-child {
            display: flex;
            border-radius: 1rem;
            border: solid 1px white;
            background-color: white;
            border-color: rgba(173, 216, 230, 0.5);

            > div {
                padding: 0.5rem 0.75rem;

                &:hover {
                    cursor: pointer;
                    background-color: rgba(173, 216, 230, 0.5);
                }
            }
        }
    }
}
</style>

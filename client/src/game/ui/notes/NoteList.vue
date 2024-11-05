<script setup lang="ts">
import { type DeepReadonly, computed, reactive, ref, watch } from "vue";

import { filter, map } from "../../../core/iter";
import { mostReadable } from "../../../core/utils";
import { coreStore } from "../../../store/core";
import { locationStore } from "../../../store/location";
import { noteState } from "../../systems/notes/state";
import { NoteManagerMode, type ClientNote } from "../../systems/notes/types";
import { popoutNote } from "../../systems/notes/ui";
import { propertiesState } from "../../systems/properties/state";
import { locationSettingsState } from "../../systems/settings/location/state";

const emit = defineEmits<(e: "mode", mode: NoteManagerMode) => void>();

const noteTypes = ["global", "local", "all"] as const;
const selectedNoteTypes = ref<(typeof noteTypes)[number]>("all");
const searchFilters = reactive({
    title: true,
    tags: true,
    text: false,
    author: false,
    activeLocation: true,
    includeArchivedLocations: false,
    notesWithShapes: true,
    globalIfLocalShape: false,
});

const searchBar = ref<HTMLInputElement | null>(null);
const searchFilter = ref("");
const showSearchFilters = ref(false);
const searchPage = ref(1);

const shapeFiltered = computed(() => noteState.reactive.shapeFilter !== undefined);
const shapeName = computed(() => {
    const shapeId = noteState.reactive.shapeFilter;
    if (shapeId === undefined) return undefined;
    return propertiesState.readonly.data.get(shapeId)?.name;
});

// this is probably disruptive if you quickly open with N and expect to close it with N again ?
// onMounted(() => {
//     searchBar.value?.focus();
// });

const noteArray = computed(() => {
    let it: Iterable<DeepReadonly<ClientNote>> = noteState.reactive.notes.values();
    if (!searchFilters.includeArchivedLocations) {
        it = filter(it, (n) => !locationStore.archivedLocations.value.some((l) => l.id === n.location));
    }
    const it2 = map(it, (n) => ({
        ...n,
        shapes: noteState.reactive.shapeNotes.get2(n.uuid) ?? [],
    }));
    return Array.from(it2);
});
const filteredNotes = computed(() => {
    const sf = searchFilter.value.trim().toLowerCase();
    const searchLocal = selectedNoteTypes.value !== "global";
    const searchGlobal = selectedNoteTypes.value !== "local";
    const locationId = locationSettingsState.reactive.activeLocation;
    const notes: typeof noteArray.value = [];
    for (const note of noteArray.value) {
        if (shapeFiltered.value) {
            if (!note.shapes.some((s) => s === noteState.reactive.shapeFilter)) {
                continue;
            }
        } else {
            if (!searchFilters.notesWithShapes && note.shapes.length > 0) continue;
            if (!note.isRoomNote) {
                if (!searchGlobal) {
                    if (!searchFilters.globalIfLocalShape || note.shapes.length === 0) {
                        continue;
                    }
                }
            } else {
                if (!searchLocal || (searchFilters.activeLocation && locationId !== note.location)) {
                    continue;
                }
            }
        }

        if (sf.length === 0) {
            notes.push(note);
            continue;
        }

        if (searchFilters.title && note.title.toLowerCase().includes(sf)) {
            notes.push(note);
        } else if (searchFilters.tags && note.tags.some((tag) => tag.name.toLowerCase().includes(sf))) {
            notes.push(note);
        } else if (searchFilters.text && note.text.toLowerCase().includes(sf)) {
            notes.push(note);
        } else if (searchFilters.author && note.creator.toLowerCase().includes(sf)) {
            notes.push(note);
        }
    }
    return notes;
});

watch(filteredNotes, () => {
    searchPage.value = 1;
});

const pageSize = 25;
const visibleNotes = computed(() => {
    return {
        notes: filteredNotes.value.slice((searchPage.value - 1) * pageSize, searchPage.value * pageSize),
        hasNext: filteredNotes.value.length > searchPage.value * pageSize,
    };
});

function editNote(noteId: string): void {
    noteState.mutableReactive.currentNote = noteId;
    emit("mode", NoteManagerMode.Edit);
}

function clearShapeFilter(): void {
    noteState.mutableReactive.shapeFilter = undefined;
}
</script>

<template>
    <header>
        <div>NOTES {{ shapeName ? `for ${shapeName}` : "" }}</div>
    </header>
    <div id="notes-search" :class="shapeFiltered ? 'disabled' : ''">
        <div>
            <select
                v-show="!shapeFiltered"
                id="kind-selector"
                v-model="selectedNoteTypes"
            >
                <option v-for="type in noteTypes" :key="type" :value="type">
                    {{ type }}
                </option>
            </select>
            <font-awesome-icon icon="magnifying-glass" @click="searchBar?.focus()" />
            <div v-if="shapeName" class="shape-name" @click="clearShapeFilter">{{ shapeName }}</div>
            <input ref="searchBar" v-model="searchFilter" type="text" placeholder="search through your notes.." />
            <div v-show="showSearchFilters" id="search-filter">
                <fieldset>
                    <legend>Where to search</legend>
                    <div>
                        <input id="note-search-title" v-model="searchFilters.title" type="checkbox" />
                        <label for="note-search-title">title</label>
                    </div>
                    <div>
                        <input id="note-search-tags" v-model="searchFilters.tags" type="checkbox" />
                        <label for="note-search-tags">tags</label>
                    </div>
                    <div>
                        <input id="note-search-text" v-model="searchFilters.text" type="checkbox" />
                        <label for="note-search-text">text</label>
                    </div>
                    <div>
                        <input id="note-search-author" v-model="searchFilters.author" type="checkbox" />
                        <label for="note-search-author">author</label>
                    </div>
                </fieldset>
                <fieldset :disabled="selectedNoteTypes === 'global' || shapeFiltered">
                    <legend>Local: Locations</legend>
                    <div>
                        <input
                            id="note-search-active-location"
                            v-model="searchFilters.activeLocation"
                            type="checkbox"
                        />
                        <label
                            for="note-search-active-location"
                            title="Show only notes that were made in the current location"
                        >
                            only in active location
                        </label>
                    </div>
                    <div>
                        <input
                            id="note-search-archived"
                            v-model="searchFilters.includeArchivedLocations"
                            type="checkbox"
                        />
                        <label for="note-search-archived">include archived locations</label>
                    </div>
                </fieldset>
                <div></div>
                <fieldset :disabled="selectedNoteTypes === 'global' || shapeFiltered">
                    <legend>Local: Shapes</legend>
                    <div>
                        <input id="note-search-shapes" v-model="searchFilters.notesWithShapes" type="checkbox" />
                        <label for="note-search-shapes">show notes with shapes</label>
                    </div>
                    <div>
                        <input
                            id="note-search-global-if-local-shape"
                            v-model="searchFilters.globalIfLocalShape"
                            type="checkbox"
                        />
                        <label
                            for="note-search-global-if-local-shape"
                            title="Global notes might be associated with a specific shape due to templating. Toggle this setting if you wish to list global notes that are associated with a shape in the current campaign"
                        >
                            show global note if local shape
                        </label>
                    </div>
                </fieldset>
            </div>
            <div id="search-icons">
                <font-awesome-icon
                    icon="sliders"
                    :style="{ opacity: showSearchFilters ? 1 : 0.5 }"
                    @click="showSearchFilters = !showSearchFilters"
                />
            </div>
        </div>
    </div>
    <template v-if="visibleNotes.notes.length === 0">
        <div id="no-notes">
            <template v-if="noteState.reactive.notes.size === 0">You don't have any notes yet!</template>
            <template v-else>
                <span>You have no notes that match this filter.</span>
            </template>
        </div>
    </template>
    <template v-else>
        <div id="notes-table">
            <div class="header">NAME</div>
            <div class="header">OWNER</div>
            <div class="header">TAGS</div>
            <div class="header">ACTIONS</div>
            <template v-if="visibleNotes.hasNext || searchPage > 1">
                <div />
                <div />
                <div />
                <div>
                    <font-awesome-icon
                        icon="chevron-left"
                        :style="{ opacity: searchPage > 1 ? 1 : 0.5 }"
                        @click="searchPage = Math.max(1, searchPage - 1)"
                    />
                    <font-awesome-icon
                        icon="chevron-right"
                        :style="{ opacity: visibleNotes.hasNext ? 1 : 0.5 }"
                        @click="if (visibleNotes.hasNext) searchPage += 1;"
                    />
                </div>
            </template>
            <template v-for="note of visibleNotes.notes" :key="note.uuid">
                <div class="title" @click="editNote(note.uuid)">{{ note.title }}</div>
                <div>{{ note.creator === coreStore.state.username ? "you" : note.creator }}</div>
                <div class="note-tags">
                    <div
                        v-for="tag of note.tags"
                        :key="tag.name"
                        :style="{ color: mostReadable(tag.colour), backgroundColor: tag.colour }"
                    >
                        {{ tag.name }}
                    </div>
                    <div v-if="note.tags.length === 0">/</div>
                </div>
                <div class="note-actions">
                    <font-awesome-icon icon="pencil" title="Edit" @click="editNote(note.uuid)" />
                    <font-awesome-icon
                        :icon="['far', 'window-restore']"
                        title="Pop-out"
                        @click="popoutNote(note.uuid)"
                    />
                </div>
            </template>
        </div>
    </template>
    <footer>
        <div style="flex-grow: 1"></div>
        <div id="new-note-selector" @click="$emit('mode', NoteManagerMode.Create)">
            New note{{ shapeName ? ` for ${shapeName}` : "" }}
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
    position: relative;

    > div {
        position: relative;
        display: flex;
        align-items: center;
        height: 2.7rem;
        border: solid 2px black;
        border-radius: 1rem;
        z-index: 1;

        > #kind-selector {
            height: calc(100% + 4px); // 2px border on top and bottom
            margin-left: -2px; // 2px border on left
            border-color: black;
            text-transform: capitalize;
            font-size: 1.25em;
            text-align-last: center;
        }

        > svg:first-of-type {
            margin-left: 1rem;
        }

        > .shape-name {
            margin-left: 0.5rem;
            font-weight: bold;

            &:hover {
                text-decoration: line-through;
                cursor: pointer;
            }
        }

        > input {
            padding: 0.5rem 1rem;
            flex-grow: 1;
            margin-right: 0.5rem;

            outline: none;
            border: none;
            border-radius: 1rem;

            font-size: 1.25em;
        }

        > #search-icons {
            position: absolute;
            display: flex;
            right: 1.5rem;
        }

        #search-filter-toggle {
            position: absolute;
            right: 1.5rem;
        }

        #search-filter {
            position: absolute;
            top: -2px;
            right: -2px;

            display: grid;
            grid-template-columns: repeat(2, auto);
            gap: 0.5rem;

            padding: 1rem;
            padding-top: 2rem;
            border: solid 2px black;
            border-radius: 1rem;

            background-color: white;

            label {
                display: inline-block;
            }
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
    grid-template-columns: 1fr auto minmax(5rem, auto) auto;
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
        background-color: lightblue;
        border: solid 2px lightblue;
        border-radius: 1rem;

        padding: 0.5rem 0.75rem;

        &:hover {
            cursor: pointer;
            background-color: rgba(173, 216, 230, 0.5);
        }
    }
}
</style>

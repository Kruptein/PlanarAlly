<script setup lang="ts">
import { type DeepReadonly, computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { filter, map } from "../../../core/iter";
import { mostReadable } from "../../../core/utils";
import { coreStore } from "../../../store/core";
import { locationStore } from "../../../store/location";
import { noteState } from "../../systems/notes/state";
import { NoteManagerMode, type ClientNote, type NoteTag } from "../../systems/notes/types";
import { popoutNote } from "../../systems/notes/ui";
import { propertiesState } from "../../systems/properties/state";
import { locationSettingsState } from "../../systems/settings/location/state";

import TagAutoCompleteSearch from "./TagAutoCompleteSearch.vue";

const emit = defineEmits<(e: "mode", mode: NoteManagerMode) => void>();

const { t } = useI18n();

onMounted(() => {
    document.addEventListener("pointerdown", handleClickOutsideDialog);
});

onUnmounted(() => {
    document.removeEventListener("pointerdown", handleClickOutsideDialog);
});

const noteTypes = ["global", "local", "all"] as const;
const selectedNoteTypes = ref<(typeof noteTypes)[number]>(
    (localStorage.getItem("note-display-type") as (typeof noteTypes)[number]) ?? "local",
);
watch(selectedNoteTypes, () => {
    localStorage.setItem("note-display-type", selectedNoteTypes.value);
});

const searchFilters = reactive({
    title: true,
    text: false,
    author: false,
    activeLocation: true,
    includeArchivedLocations: false,
    notesWithShapes: true,
    globalIfLocalShape: false,
});

const searchBar = ref<HTMLInputElement | null>(null);
const searchOptionsDialog = ref<HTMLDivElement | null>(null);
const searchTags = ref<NoteTag[]>([]);
const searchFilter = ref("");
const showSearchFilters = ref(false);
const showTagSearch = ref(false);
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

const availableTags = computed(() => {
    const tagList = new Map<string, NoteTag>();
    for (const [_, note] of noteState.reactive.notes) {
        for (const tag of note.tags) {
            tagList.set(tag.name, tag);
        }
    }
    return Array.from(tagList, ([name, value]) => value).sort((a, b) => a.name.localeCompare(b.name));
});

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

function containsSearchTags(note: (typeof noteArray.value)[number]): boolean {
    for (const tag of searchTags.value) {
        if (!note.tags.some((t) => t.name === tag.name)) {
            return false;
        }
    }
    return true;
}

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

        if (!containsSearchTags(note)) {
            continue;
        }

        if (sf.length === 0) {
            notes.push(note);
            continue;
        }

        if (searchFilters.title && note.title.toLowerCase().includes(sf)) {
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

function handleClickOutsideDialog(event: MouseEvent): void {
    if (searchOptionsDialog.value) {
        if (showSearchFilters.value && !searchOptionsDialog.value.contains(event.target as Node)) {
            showSearchFilters.value = false;
        }
    }
}

function toggleTagInSearch(tag: NoteTag): void {
    const tempArray = searchTags.value.filter((x) => x.name !== tag.name);
    if (tempArray.length === searchTags.value.length) {
        searchTags.value.push(tag);
    } else {
        searchTags.value = tempArray;
    }
}

function editNote(noteId: string): void {
    noteState.mutableReactive.currentNote = noteId;
    emit("mode", NoteManagerMode.Edit);
}

function clearShapeFilter(): void {
    noteState.mutableReactive.shapeFilter = undefined;
}

function clearSearchBar(): void {
    searchFilter.value = "";
    searchBar.value?.focus();
}
</script>

<template>
    <header>
        <div>
            {{ t("game.ui.notes.NoteList.title") }}
            {{ shapeName ? `${t("game.ui.notes.NoteList.title_with_token")} ${shapeName}` : "" }}
        </div>
    </header>
    <div id="notes-search" :class="shapeFiltered ? 'disabled' : ''">
        <div id="search-bar">
            <select v-show="!shapeFiltered" id="kind-selector" v-model="selectedNoteTypes">
                <option v-for="type in noteTypes" :key="type" :value="type">
                    {{ t(`game.ui.notes.note_types.${type}`) }}
                </option>
            </select>
            <font-awesome-icon icon="magnifying-glass" @click="searchBar?.focus()" />
            <div id="search-field">
                <input
                    ref="searchBar"
                    v-model="searchFilter"
                    type="text"
                    :placeholder="t('game.ui.notes.NoteList.search_placeholder')"
                />
                <font-awesome-icon
                    v-show="searchFilter.length > 0"
                    id="clear-button"
                    icon="circle-xmark"
                    :title="t('game.ui.notes.NoteList.clear_search')"
                    @click.stop="clearSearchBar"
                />
            </div>
            <font-awesome-icon
                id="search-options-icon"
                icon="sliders"
                style="opacity: 0.5"
                @click="showSearchFilters = true"
            />
            <div v-show="showSearchFilters" id="search-filter" ref="searchOptionsDialog">
                <font-awesome-icon id="search-options-close-icon" icon="sliders" @click="showSearchFilters = false" />
                <fieldset>
                    <legend>{{ t("game.ui.notes.NoteList.filter.where_to_search") }}</legend>
                    <div>
                        <input id="note-search-title" v-model="searchFilters.title" type="checkbox" />
                        <label for="note-search-title">{{ t("game.ui.notes.NoteList.filter.title") }}</label>
                    </div>
                    <div>
                        <input id="note-search-text" v-model="searchFilters.text" type="checkbox" />
                        <label for="note-search-text">{{ t("game.ui.notes.NoteList.filter.text") }}</label>
                    </div>
                    <div>
                        <input id="note-search-author" v-model="searchFilters.author" type="checkbox" />
                        <label for="note-search-author">{{ t("game.ui.notes.NoteList.filter.author") }}</label>
                    </div>
                </fieldset>
                <fieldset :disabled="selectedNoteTypes === 'global' || shapeFiltered">
                    <legend>{{ t("game.ui.notes.NoteList.filter.local_locations") }}</legend>
                    <div>
                        <input
                            id="note-search-active-location"
                            v-model="searchFilters.activeLocation"
                            type="checkbox"
                        />
                        <label
                            for="note-search-active-location"
                            :title="t('game.ui.notes.NoteList.filter.active_location_title')"
                        >
                            {{ t("game.ui.notes.NoteList.filter.active_location") }}
                        </label>
                    </div>
                    <div>
                        <input
                            id="note-search-archived"
                            v-model="searchFilters.includeArchivedLocations"
                            type="checkbox"
                        />
                        <label for="note-search-archived">
                            {{ t("game.ui.notes.NoteList.filter.archived_location") }}
                        </label>
                    </div>
                </fieldset>
                <div></div>
                <fieldset :disabled="selectedNoteTypes === 'global' || shapeFiltered">
                    <legend>{{ t("game.ui.notes.NoteList.filter.local_shapes") }}</legend>
                    <div>
                        <input id="note-search-shapes" v-model="searchFilters.notesWithShapes" type="checkbox" />
                        <label for="note-search-shapes">{{ t("game.ui.notes.NoteList.filter.note_with_shape") }}</label>
                    </div>
                    <div>
                        <input
                            id="note-search-global-if-local-shape"
                            v-model="searchFilters.globalIfLocalShape"
                            type="checkbox"
                        />
                        <label
                            for="note-search-global-if-local-shape"
                            :title="t('game.ui.notes.NoteList.filter.global_note_title')"
                        >
                            {{ t("game.ui.notes.NoteList.filter.global_note") }}
                        </label>
                    </div>
                </fieldset>
            </div>
        </div>
        <div id="search-filters">
            <span style="padding-right: 1rem">{{ t("game.ui.notes.NoteList.filters.title") }}</span>
            <div id="filter-bubbles">
                <div v-if="shapeName" class="shape-name tag-bubble removable" @click="clearShapeFilter">
                    {{ shapeName }}
                </div>
                <div
                    v-for="tag of searchTags"
                    :key="tag.name"
                    :style="{ color: mostReadable(tag.colour), backgroundColor: tag.colour }"
                    class="tag-bubble removable"
                    @click="toggleTagInSearch(tag)"
                >
                    {{ tag.name }}
                </div>
            </div>
            <TagAutoCompleteSearch
                v-show="showTagSearch"
                id="tag-search-bar"
                :placeholder="t('game.ui.notes.NoteList.filters.tag_placeholder')"
                :options="availableTags"
                @picked="toggleTagInSearch"
            />
            <font-awesome-icon
                v-if="showTagSearch"
                id="tag-search-show"
                icon="minus"
                :title="t('game.ui.notes.NoteList.filters.hide_title')"
                @click="showTagSearch = false"
            />
            <font-awesome-icon
                v-else
                id="tag-search-hide"
                icon="plus"
                :title="t('game.ui.notes.NoteList.filters.show_title')"
                @click="showTagSearch = true"
            />
        </div>
    </div>
    <template v-if="visibleNotes.notes.length === 0">
        <div id="no-notes">
            <template v-if="noteState.reactive.notes.size === 0">{{ t("game.ui.notes.NoteList.empty_note") }}</template>
            <template v-else>
                <span>{{ t("game.ui.notes.NoteList.empty_search") }}</span>
            </template>
        </div>
    </template>
    <template v-else>
        <div id="notes-table">
            <div class="header">{{ t("game.ui.notes.NoteList.name") }}</div>
            <div class="header">{{ t("game.ui.notes.NoteList.owner") }}</div>
            <div class="header">{{ t("game.ui.notes.NoteList.tags") }}</div>
            <div class="header">{{ t("game.ui.notes.NoteList.actions") }}</div>
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
                <div>{{ note.creator === coreStore.state.username ? t("common.you") : note.creator }}</div>
                <div class="note-tags">
                    <div
                        v-for="tag of note.tags"
                        :key="tag.name"
                        :style="{ color: mostReadable(tag.colour), backgroundColor: tag.colour }"
                        class="tag-bubble"
                        :title="`${t('game.ui.notes.NoteList.toggle_tags')}${tag.name}`"
                        @click="toggleTagInSearch(tag)"
                    >
                        {{ tag.name }}
                    </div>
                    <div v-if="note.tags.length === 0">/</div>
                </div>
                <div class="note-actions">
                    <font-awesome-icon
                        icon="pencil"
                        :title="t('game.ui.notes.NoteDialog.edit')"
                        @click="editNote(note.uuid)"
                    />
                    <font-awesome-icon
                        :icon="['far', 'window-restore']"
                        :title="t('game.ui.notes.NoteDialog.pop_out')"
                        @click="popoutNote(note.uuid)"
                    />
                </div>
            </template>
        </div>
    </template>
    <footer>
        <div style="flex-grow: 1"></div>
        <div id="new-note-selector" @click="$emit('mode', NoteManagerMode.Create)">
            {{ t("game.ui.menu.MenuBar.new_note")
            }}{{ shapeName ? ` ${t("game.ui.notes.NoteList.title_with_token")} ${shapeName}` : "" }}
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

    > #search-bar {
        position: relative;
        display: flex;
        align-items: center;
        height: 2.7rem;
        border: solid 2px black;
        border-radius: 1rem;

        > #kind-selector {
            flex-shrink: 0;
            height: calc(100% + 4px); // 2px border on top and bottom
            margin-left: -2px; // 2px border on left
            border-radius: 1rem;
            border: solid 2px black;
            outline: none;
            text-transform: capitalize;
            font-size: 1.25em;
            text-align-last: center;
            padding: 0 0.5em;
            background-color: rgba(238, 244, 255, 1);
            > option {
                background-color: rgba(245, 245, 245, 1);
            }
        }

        > svg:first-of-type {
            margin-left: 1rem;
        }

        > .shape-name {
            flex-shrink: 0;
            margin-left: 0.5rem;
            font-weight: bold;

            &:hover {
                text-decoration: line-through;
                cursor: pointer;
            }
        }

        > #search-field {
            flex-grow: 1;
            flex-shrink: 1;

            outline: none;
            border: none;
            border-radius: 1rem;

            display: flex;
            align-items: center;
            width: 100%;

            > input {
                padding: 0.5rem 1rem;
                outline: none;
                border: none;
                border-radius: 1rem;
                flex-grow: 1;

                font-size: 1.25em;
            }
            > #clear-button {
                border: 0;
                font-size: 1rem;
                cursor: pointer;
            }
        }
        > #search-options-icon {
            margin: 0 1rem;
        }

        #search-options-close-icon {
            position: absolute;
            right: 1rem;
            top: 0.7rem;
        }

        #search-filter {
            z-index: 1;
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
    > #search-filters {
        margin: 0 1rem 0;
        display: flex;
        flex-direction: row;
        align-items: center;
        min-height: 2.7rem;
        border-bottom: solid 2px black;

        > #filter-bubbles {
            flex: 5 0 0;
            display: flex;
            flex-direction: row;
            align-items: center;
            flex-wrap: wrap;
            row-gap: 0.5rem;
            height: 100%;
            padding: 0.25rem;

            > .shape-name {
                font-weight: bold;
                border: solid 2px black;
            }

            > div {
                flex: 0 1 auto;
                word-break: break-word;
            }
        }
        > #tag-search-bar {
            flex: 2 1 0;
            height: 1.5rem;
            min-width: 8rem;
        }

        > #tag-search-show,
        > #tag-search-hide {
            flex: 0 0 auto;
            margin: 0 0.5rem;
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
.tag-bubble {
    padding: 0.25rem 0.5rem;
    border-radius: 0.5rem;
    margin-right: 0.5rem;
}

.tag-bubble.is-active,
.tag-bubble:hover {
    filter: brightness(85%);
    cursor: pointer;
}

.removable:hover {
    text-decoration: line-through;
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

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import type { LocalId } from "../../../core/id";
import { NO_FILTER } from "../../../core/symbols";
import { mostReadable } from "../../../core/utils";
import { coreStore } from "../../../store/core";
import { locationStore } from "../../../store/location";
import { getShape } from "../../id";
import type { IAsset } from "../../interfaces/shapes/asset";
import { gameState } from "../../systems/game/state";
import { noteState } from "../../systems/notes/state";
import { type NoteId, NoteManagerMode, type NoteTag } from "../../systems/notes/types";
import { popoutNote } from "../../systems/notes/ui";
import { propertiesState } from "../../systems/properties/state";
import { locationSettingsState } from "../../systems/settings/location/state";

import NoteFilter from "./NoteFilter.vue";

const emit = defineEmits<(e: "mode", mode: NoteManagerMode) => void>();

const { t } = useI18n();

onMounted(() => {
    document.addEventListener("pointerdown", handleClickOutsideDialog);
});

onUnmounted(() => {
    document.removeEventListener("pointerdown", handleClickOutsideDialog);
});

const searchFilters = reactive({
    title: true,
    text: false,
    author: false,
});

const searchBar = ref<HTMLInputElement | null>(null);
const searchOptionsDialog = ref<HTMLDivElement | null>(null);
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

const noteArray = computed(() =>
    // temp-fix for vue iterator method breaking
    Iterator.from(noteState.reactive.notes.values())
        .map((n) => ({
            ...n,
            shapes: noteState.reactive.shapeNotes.get2(n.uuid) ?? [],
        }))
        .toArray(),
);

function getDefaultFilter<T extends string | number | symbol>(
    key: string,
    defaultOptions: { label: string; value: T }[],
    defaultValue: T[],
): T[] {
    const value = localStorage.getItem(key);
    if (value !== null) {
        let indices: number[] = [];
        try {
            indices = JSON.parse(value) as number[];
            return indices.map((i) => defaultOptions[i]!.value);
        } catch (error) {
            return defaultValue;
        }
    }
    return defaultValue;
}

function saveDefaultFilter<T extends string | number | symbol>(
    key: string,
    defaultOptions: { label: string; value: T }[],
    value: T[],
): void {
    const indices = value.map((v) => defaultOptions.findIndex((o) => o.value === v));
    localStorage.setItem(key, JSON.stringify(indices));
}

const NO_LINK_FILTER = Symbol("NO_LINK_FILTER");
const ACTIVE_CAMPAIGN_FILTER = Symbol("ACTIVE_CAMPAIGN_FILTER");
const roomFilterOptions = computed(() => {
    return {
        default: [
            { label: "(no filter)", value: NO_FILTER },
            {
                label: "active campaign",
                value: ACTIVE_CAMPAIGN_FILTER,
                disabled: noteArray.value.every((n) =>
                    n.rooms.every((r) => `${r.roomCreator}/${r.roomName}` !== gameState.fullRoomName.value),
                ),
            },
            {
                label: "no campaign links",
                value: NO_LINK_FILTER,
                disabled: noteArray.value.every((n) => n.rooms.length > 0),
            },
        ],
    };
});
const roomFilter = ref<(string | symbol)[]>(
    getDefaultFilter("note-room-filter", roomFilterOptions.value.default, [ACTIVE_CAMPAIGN_FILTER]),
);

watch(roomFilter, () => {
    saveDefaultFilter("note-room-filter", roomFilterOptions.value.default, roomFilter.value);
});

const ACTIVE_LOCATION_FILTER = Symbol("ACTIVE_LOCATION_FILTER");
const locationFilterOptions = computed(() => {
    return {
        default: [
            { label: "(no filter)", value: NO_FILTER },
            {
                label: "active location",
                value: ACTIVE_LOCATION_FILTER,
                disabled: noteArray.value.every((n) =>
                    n.rooms.every((r) => r.locationId !== locationSettingsState.reactive.activeLocation),
                ),
            },
            {
                label: "no location links",
                value: NO_LINK_FILTER,
                disabled: noteArray.value.every((n) => n.rooms.every((r) => r.locationId !== null)),
            },
        ],
        search: locationStore.activeLocations.value
            .filter((l) => noteArray.value.some((n) => n.rooms.some((r) => r.locationId === l.id)))
            .map((l) => ({ label: l.name, value: l.id })),
    };
});
const locationFilter = ref<(number | symbol)[]>(
    getDefaultFilter("note-location-filter", locationFilterOptions.value.default, [
        ACTIVE_LOCATION_FILTER,
        NO_LINK_FILTER,
    ]),
);

watch(locationFilter, () => {
    saveDefaultFilter("note-location-filter", locationFilterOptions.value.default, locationFilter.value);
});

const HAS_SHAPE_FILTER = Symbol("HAS_SHAPE_FILTER");
const shapeFilterOptions = computed(() => {
    return {
        default: [
            { label: "(no filter)", value: NO_FILTER },
            {
                label: "has shape(s)",
                value: HAS_SHAPE_FILTER,
                disabled: noteArray.value.every((n) => n.shapes.length === 0),
            },
            {
                label: "no shape(s)",
                value: NO_LINK_FILTER,
                disabled: noteArray.value.every((n) => n.shapes.length > 0),
            },
        ],
        search: noteState.localShapeNotes.value
            .entries2()
            .filter(([, notes]) => noteArray.value.some((n) => notes.includes(n.uuid)))
            .map(([l]) => {
                const shape = getShape(l);
                // we pass by the reactive state, to catch renames made by the client
                // renames made by another client will not be caught this way though
                // it feels somewhat overkill to actively load all these shapes just for this
                const props = propertiesState.reactive.data.get(l) ?? propertiesState.readonly.data.get(l);
                const url = shape && shape.type === "assetrect" ? (shape as IAsset).src : undefined;
                return {
                    label: props?.name ?? "Unknown Shape",
                    value: l,
                    icon: url,
                };
            })
            .toArray(),
    };
});
const shapeFilter = ref<(LocalId | symbol)[]>(
    getDefaultFilter("note-shape-filter", shapeFilterOptions.value.default, [NO_FILTER]),
);

watch(shapeFilter, () => {
    saveDefaultFilter("note-shape-filter", shapeFilterOptions.value.default, shapeFilter.value);
});

const HAS_TAG_FILTER = Symbol("HAS_SHAPE_FILTER");
const tagFilterOptions = computed(() => {
    const tagList = new Set<string>();
    for (const [_, note] of noteState.reactive.notes) {
        for (const tag of note.tags) {
            tagList.add(tag.name);
        }
    }
    return {
        default: [
            { label: "(no filter)", value: NO_FILTER },
            {
                label: "has tag(s)",
                value: HAS_TAG_FILTER,
                disabled: noteArray.value.every((n) => n.tags.length === 0),
            },
            {
                label: "no tag(s)",
                value: NO_LINK_FILTER,
                disabled: noteArray.value.every((n) => n.tags.length > 0),
            },
        ],
        search: tagList
            .values()
            .filter((name) => noteArray.value.some((n) => n.tags.some((t) => t.name === name)))
            .map((name) => ({ label: name, value: name }))
            .toArray(),
    };
});
const tagFilter = ref<(string | symbol)[]>(
    getDefaultFilter("note-tag-filter", tagFilterOptions.value.default, [NO_FILTER]),
);
watch(tagFilter, () => {
    saveDefaultFilter("note-tag-filter", tagFilterOptions.value.default, tagFilter.value);
});

const filteredNotes = computed(() => {
    const sf = searchFilter.value.trim().toLowerCase();
    const notes: typeof noteArray.value = [];

    const _roomFilter = roomFilter.value[0];

    for (const note of noteArray.value) {
        const roomLinks = note.rooms.filter((r) => `${r.roomCreator}/${r.roomName}` === gameState.fullRoomName.value);

        let match = false;
        if (_roomFilter === NO_FILTER) match = true;
        else if (_roomFilter === NO_LINK_FILTER) {
            if (roomLinks.length === 0) match = true;
        } else if (roomLinks.length > 0) match = true;
        if (!match) continue;

        match = false;
        if (locationFilter.value.includes(NO_FILTER)) match = true;
        else if (locationFilter.value.includes(ACTIVE_LOCATION_FILTER)) {
            if (roomLinks.some((r) => r.locationId === locationSettingsState.reactive.activeLocation)) match = true;
        } else if (locationFilter.value.includes(NO_LINK_FILTER) && roomLinks.some((r) => r.locationId === null))
            match = true;
        else if (roomLinks.some((r) => r.locationId !== null && locationFilter.value.includes(r.locationId)))
            match = true;
        if (!match) continue;

        match = false;
        if (shapeFiltered.value && note.shapes.some((s) => s === noteState.reactive.shapeFilter)) {
            match = true;
        } else if (shapeFilter.value.includes(NO_FILTER)) {
            match = true;
        } else if (shapeFilter.value.includes(HAS_SHAPE_FILTER)) {
            if (note.shapes.length > 0) match = true;
        } else if (shapeFilter.value.includes(NO_LINK_FILTER)) {
            if (note.shapes.length === 0) match = true;
        } else if (note.shapes.some((s) => shapeFilter.value.includes(s))) {
            match = true;
        }
        if (!match) continue;

        match = false;
        if (tagFilter.value.includes(NO_FILTER)) match = true;
        else if (tagFilter.value.includes(HAS_TAG_FILTER)) {
            if (note.tags.length > 0) match = true;
        }
        if (tagFilter.value.includes(NO_LINK_FILTER)) {
            if (note.tags.length === 0) match = true;
        }
        if (note.tags.some((t) => tagFilter.value.includes(t.name))) {
            match = true;
        }
        if (!match) continue;

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
    if (tagFilter.value.includes(tag.name)) {
        tagFilter.value = tagFilter.value.filter((x) => x !== tag.name);
        if (tagFilter.value.length === 0) {
            tagFilter.value.push(NO_FILTER);
        }
    } else {
        tagFilter.value.push(tag.name);
    }
}

function editNote(noteId: NoteId): void {
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
            </div>
        </div>
        <div id="search-filters">
            <span style="padding-right: 1rem">{{ t("game.ui.notes.NoteList.filters.title") }}</span>
            <NoteFilter v-model="roomFilter" label="campaign" :options="roomFilterOptions" :multi-select="false" />
            <NoteFilter
                v-model="locationFilter"
                label="location"
                :multi-select="true"
                :options="locationFilterOptions"
                :disabled="roomFilter.includes(NO_FILTER) || roomFilter.includes(NO_LINK_FILTER)"
            />
            <NoteFilter
                v-show="!shapeFiltered"
                v-model="shapeFilter"
                label="shape"
                :options="shapeFilterOptions"
                :multi-select="true"
            />
            <NoteFilter v-model="tagFilter" label="tag" :options="tagFilterOptions" :multi-select="true" />
            <div id="filter-bubbles">
                <div v-if="shapeName" class="shape-name tag-bubble removable" @click="clearShapeFilter">
                    {{ shapeName }}
                </div>
            </div>
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
        padding: 0.5rem 1rem;
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        row-gap: 0.5rem;
        align-items: center;
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

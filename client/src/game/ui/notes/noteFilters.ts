import { computed, reactive, watch } from "vue";

import type { LocalId } from "../../../core/id";
import { noteState } from "../../systems/notes/state";
import { ACTIVE_FILTER, NO_FILTER, NO_LINK_FILTER } from "../../systems/notes/types";

export const customFilterOptions = reactive({
    locations: [] as { id: number; name: string }[],
    shapes: [] as { id: LocalId; name: string; assetHash: string }[],
    tags: [] as string[],
});

export const roomFilterOptions = computed(() => {
    return {
        default: [
            { label: "(no filter)", value: NO_FILTER },
            {
                label: "active campaign",
                value: ACTIVE_FILTER,
            },
            {
                label: "no campaign links",
                value: NO_LINK_FILTER,
            },
        ],
    };
});

export const locationFilterOptions = computed(() => {
    return {
        default: [
            { label: "(no filter)", value: NO_FILTER },
            {
                label: "active location",
                value: ACTIVE_FILTER,
            },
            {
                label: "no location links",
                value: NO_LINK_FILTER,
            },
        ],
        search: customFilterOptions.locations.map((l) => ({ label: l.name, value: l.id })),
    };
});

export const shapeFilterOptions = computed(() => {
    return {
        default: [
            { label: "(no filter)", value: NO_FILTER },
            {
                label: "has shape(s)",
                value: ACTIVE_FILTER,
            },
            {
                label: "no shape(s)",
                value: NO_LINK_FILTER,
            },
        ],
        search: customFilterOptions.shapes.map((s) => ({
            label: s.name,
            value: s.id,
            icon: s.assetHash,
        })),
    };
});

// TAGS

export const tagFilterOptions = computed(() => {
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
                value: ACTIVE_FILTER,
            },
            {
                label: "no tag(s)",
                value: NO_LINK_FILTER,
            },
        ],
        search: customFilterOptions.tags.map((t) => ({ label: t, value: t })),
    };
});

// CORE STATE

export const filters = reactive({
    locations: getDefaultFilter("note-location-filter", locationFilterOptions.value.default, [
        ACTIVE_FILTER,
        NO_LINK_FILTER,
    ]) as (number | symbol)[],
    rooms: getDefaultFilter("note-room-filter", roomFilterOptions.value.default, [ACTIVE_FILTER]),
    shapes: getDefaultFilter("note-shape-filter", shapeFilterOptions.value.default, [NO_FILTER]) as (
        | LocalId
        | symbol
    )[],
    tags: getDefaultFilter("note-tag-filter", tagFilterOptions.value.default, [NO_FILTER]) as (string | symbol)[],
});

watch(filters.rooms, (rooms) => {
    saveDefaultFilter("note-room-filter", roomFilterOptions.value.default, rooms);
});

watch(filters.locations, (locations) => {
    saveDefaultFilter("note-location-filter", locationFilterOptions.value.default, locations);
});

watch(filters.shapes, (shapes) => {
    saveDefaultFilter("note-shape-filter", shapeFilterOptions.value.default, shapes);
});

watch(filters.tags, (tags) => {
    saveDefaultFilter("note-tag-filter", tagFilterOptions.value.default, tags);
});

// UTILITY FUNCTIONS

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
        } catch {
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

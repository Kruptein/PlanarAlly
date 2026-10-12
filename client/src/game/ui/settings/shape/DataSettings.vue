<script setup lang="ts">
import { computed, ref, watch, type ComputedRef } from "vue";
import { useI18n } from "vue-i18n";

import { roomMods } from "../../../../mods";
import { customDataSystem } from "../../../systems/customData";
import { customDataState } from "../../../systems/customData/state";
import { ShapeCustomDataPending, USER_CUSTOM_DATA_SOURCE } from "../../../systems/customData/types";
import { selectedState } from "../../../systems/selected/state";

import DataSettingsBranch from "./DataSettingsBranch.vue";
import { type Branch, type Tree } from "./types";

defineProps<{
    tabSelected: ComputedRef<string>;
}>();
defineEmits<(e: "close") => void>();

const { t } = useI18n();

watch(
    () => selectedState.reactive.focus,
    (newFocus, oldFocus) => {
        if (newFocus) customDataSystem.loadState(newFocus, "shape-edit");
        if (oldFocus) customDataSystem.dropState(oldFocus, "shape-edit");
    },
    { immediate: true },
);

const elements = computed(() => customDataState.reactive.data.get(selectedState.reactive.focus!) ?? []);

function getSourceLabel(source: string): string {
    if (source.toLowerCase() === USER_CUSTOM_DATA_SOURCE)
        return t("game.ui.selection.edit_dialog.customData.userSource");
    return roomMods.value.find((mod) => mod.tag === source)?.name ?? source;
}

// The user source is always available, so there is a place to add new data
const sources = computed(() => {
    const sources = new Map<string, string>();
    for (const element of elements.value) {
        const key = element.source.toLowerCase();
        if (key !== USER_CUSTOM_DATA_SOURCE && !sources.has(key)) sources.set(key, element.source);
    }
    return [
        USER_CUSTOM_DATA_SOURCE,
        ...[...sources.values()].sort((a, b) => getSourceLabel(a).localeCompare(getSourceLabel(b))),
    ];
});

const selectedSource = ref(USER_CUSTOM_DATA_SOURCE);
const isUserSource = computed(() => selectedSource.value.toLowerCase() === USER_CUSTOM_DATA_SOURCE);

watch(sources, (newSources) => {
    if (!newSources.includes(selectedSource.value)) selectedSource.value = USER_CUSTOM_DATA_SOURCE;
});

// Data of other sources is managed by mods, editing it has to be unlocked explicitly
const unlocked = ref(false);
const editable = computed(() => isUserSource.value || unlocked.value);

watch([selectedSource, () => selectedState.reactive.focus], () => {
    unlocked.value = false;
});

const tree = computed(() => {
    const tree: Tree = [];
    const source = selectedSource.value.toLowerCase();
    for (const element of elements.value) {
        if (element.source.toLowerCase() !== source) continue;
        let currentBranch = tree;
        let prefix = "/";
        for (const part of element.prefix.split("/")) {
            if (part === "") continue;
            let branch = currentBranch.find((b): b is Branch => "children" in b && b.name === part);
            if (!branch) {
                branch = { prefix, name: part, children: [] };
                currentBranch.push(branch);
            }
            currentBranch = branch.children;
            prefix += part + "/";
        }
        if (element.pending === ShapeCustomDataPending.Branch) continue;
        currentBranch.push(element);
    }
    return tree;
});
</script>

<template>
    <div id="custom-data-settings">
        <div v-if="sources.length > 1" id="source-tabs">
            <div
                v-for="source of sources"
                :key="source"
                :class="{ active: source === selectedSource }"
                :title="`${getSourceLabel(source)} (${source})`"
                @click="selectedSource = source"
            >
                {{ getSourceLabel(source) }}
            </div>
        </div>
        <div v-if="!isUserSource" id="source-lock" :class="{ unlocked }">
            <span>
                {{
                    unlocked
                        ? t("game.ui.selection.edit_dialog.customData.unlockedHint")
                        : t("game.ui.selection.edit_dialog.customData.lockedHint")
                }}
            </span>
            <button @click="unlocked = !unlocked">
                <font-awesome-icon :icon="unlocked ? 'unlock' : 'lock'" />
                {{
                    unlocked
                        ? t("game.ui.selection.edit_dialog.customData.lockEditing")
                        : t("game.ui.selection.edit_dialog.customData.unlockEditing")
                }}
            </button>
        </div>
        <DataSettingsBranch :key="selectedSource" :children="tree" :source="selectedSource" :editable="editable" />
    </div>
</template>

<style scoped lang="scss">
#custom-data-settings {
    display: flex;
    flex-direction: column;
    height: 100%;
}

#source-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    padding: 0.5rem 1rem 0;
    background-color: white;
    border-bottom: 3px solid #ffa8bf;

    > div {
        padding: 0.4rem 0.75rem;
        border-radius: 0.5rem 0.5rem 0 0;
        background-color: rgba(255, 168, 191, 0.25);
        cursor: pointer;
        max-width: 12rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        &:hover {
            background-color: rgba(255, 168, 191, 0.5);
        }

        &.active {
            background-color: #ffa8bf;
            font-weight: bold;
        }
    }
}

#source-lock {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 1rem;
    background-color: rgba(235, 240, 245, 1);
    font-style: italic;

    &.unlocked {
        background-color: rgba(255, 190, 90, 0.35);
    }

    > span {
        flex: 1;
    }

    button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-shrink: 0;
        background-color: rgba(255, 168, 191, 0.5);
        border: none;
        padding: 0.5rem;
        cursor: pointer;
        border-radius: 0.5rem;
        font-style: normal;

        &:hover {
            background-color: #ffa8bf;
        }
    }
}
</style>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

import { activeShapeStore } from "../../../../store/activeShape";
import { customDataState } from "../../../systems/customData/state";
import { diceState } from "../../../systems/dice/state";
import { selectedSystem } from "../../../systems/selected";
import { uiState } from "../../../systems/ui/state";
import { ShapeSettingCategory } from "../../settings/shape/categories";

import DiceMacro from "./DiceMacro.vue";

const { t } = useI18n();

const FILTER_THRESHOLD = 8;

const filter = ref("");

const macros = computed(() => {
    if (diceState.reactive.uiActiveShapeId === undefined) return [];
    return (
        customDataState.reactive.data
            .get(diceState.reactive.uiActiveShapeId)
            ?.filter((data) => data.kind === "dice-expression") ?? []
    );
});

const groups = computed(() => {
    const query = filter.value.trim().toLowerCase();
    const result = new Map<string, (typeof macros.value)[number][]>();
    for (const macro of macros.value) {
        if (query.length > 0 && !`${macro.prefix}/${macro.name}`.toLowerCase().includes(query)) continue;
        const group = result.get(macro.prefix);
        if (group === undefined) result.set(macro.prefix, [macro]);
        else group.push(macro);
    }
    return [...result.entries()].map(([prefix, entries]) => ({ name: prefix.replace(/^\/+|\/+$/g, ""), entries }));
});

function openSettings(): void {
    if (diceState.reactive.uiActiveShapeId === undefined) return;
    selectedSystem.focus(diceState.reactive.uiActiveShapeId);
    uiState.mutableReactive.activeShapeTab = ShapeSettingCategory.CustomData;
    activeShapeStore.setShowEditDialog(true);
}
</script>

<template>
    <div id="dice-macros" class="container">
        <h1>
            Dice Macros
            <font-awesome-icon icon="cog" @click="openSettings" />
        </h1>
        <input
            v-if="macros.length > FILTER_THRESHOLD"
            v-model="filter"
            type="search"
            class="filter"
            :placeholder="t('game.ui.tools.DiceTool.macros.filter')"
        />
        <div v-if="diceState.reactive.uiActiveShapeId !== undefined" class="macro-list">
            <div v-for="group of groups" :key="group.name" class="group">
                <div v-if="group.name.length > 0" class="group-name">{{ group.name }}</div>
                <DiceMacro
                    v-for="macro of group.entries"
                    :key="macro.id"
                    :macro="macro"
                    :shape="diceState.reactive.uiActiveShapeId"
                />
            </div>
            <div v-if="groups.length === 0" class="empty">{{ t("game.ui.tools.DiceTool.macros.no_match") }}</div>
        </div>
    </div>
</template>

<style scoped lang="scss">
#dice-macros {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;

    h1 {
        align-self: center;
        display: flex;
        align-items: center;
        gap: 0.5rem;

        svg {
            font-size: 0.9rem;
        }
    }

    .filter {
        padding: 0.25rem 0.5rem;
        border: solid 1px black;
        border-radius: 0.5rem;
    }

    .macro-list {
        max-height: min(60vh, 32rem);
        overflow-y: auto;
        scrollbar-width: thin;
        // Room for the scrollbar, so it doesn't cover the dice icons
        margin-right: -0.5rem;
        padding-right: 0.5rem;

        > .group:not(:first-child) {
            margin-top: 0.75rem;
        }

        .group-name {
            position: sticky;
            top: 0;
            z-index: 1;
            padding: 0.125rem 0.5rem;
            background-color: white;
            border-bottom: solid 1px rgba(0, 0, 0, 0.15);
            font-size: 85%;
            font-style: italic;
            color: rgba(0, 0, 0, 0.7);
        }

        > .empty {
            padding: 0.25rem 0.5rem;
            font-style: italic;
        }
    }
}
</style>

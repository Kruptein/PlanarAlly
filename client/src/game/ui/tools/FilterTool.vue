<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import type { ApiLabel } from "../../../apiTypes";
import Accordion from "../../../core/components/Accordion.vue";
import { labelSystem } from "../../systems/labels";
import { labelState } from "../../systems/labels/state";
import { filterTool } from "../../tools/variants/filter";

const { t } = useI18n();

const selected = filterTool.isActiveTool;

const categories = computed(() => {
    const cat = new Map<string, ApiLabel[]>();
    cat.set("", []);
    for (const label of labelState.reactive.labels.values()) {
        if (!label.category) {
            cat.get("")!.push(label);
        } else {
            if (!cat.has(label.category)) {
                cat.set(label.category, []);
            }
            cat.get(label.category)!.push(label);
            cat.get(label.category)!.sort((a, b) => a.name.localeCompare(b.name));
        }
    }
    return cat;
});

const initialValues = computed(() => {
    const values = new Map<string, string[]>();
    for (const [category, labels] of categories.value) {
        values.set(
            category,
            labelState.reactive.labelFilters.filter((f) => labels.map((l) => l.uuid).includes(f)),
        );
    }
    return values;
});

function updateSelection(category: string, selection: string[]): void {
    for (const label of categories.value.get(category)!) {
        const inSelection = selection.includes(label.uuid);
        const activeFilter = labelState.raw.labelFilters.includes(label.uuid);

        if (activeFilter && !inSelection) {
            labelSystem.removeLabelFilter(label.uuid, true);
        } else if (!activeFilter && inSelection) {
            labelSystem.addLabelFilter(label.uuid, true);
        }
    }
}

function getCategoryInitValues(category: string): string[] {
    return initialValues.value.get(category)!;
}
</script>

<template>
    <div v-if="selected" class="tool-detail">
        <div id="accordion-container">
            <Accordion
                v-for="[category, labels] of categories"
                :key="category"
                :title="category === '' ? t('game.ui.tools.FilterTool.no_category') : category"
                :items="labels"
                :initial-values="getCategoryInitValues(category)"
                @selectionupdate="updateSelection(category, $event)"
            />
        </div>
    </div>
</template>

<style>
.accordion {
    margin-bottom: 0.2em;
}
.accordion:last-of-type {
    margin-bottom: 0;
}
.tool-detail {
    display: block;
}
</style>

<style scoped>
#accordion-container {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    overflow-y: auto;
    max-height: 25em;
}
</style>

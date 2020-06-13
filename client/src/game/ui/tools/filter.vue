<script lang="ts">
import Component from "vue-class-component";

import Accordion from "@/core/components/accordion.vue";
import Tool from "@/game/ui/tools/tool.vue";

import { socket } from "@/game/api/socket";
import { layerManager } from "@/game/layers/manager";
import { gameStore } from "@/game/store";
import { ToolName } from "./utils";
import { ToolBasics } from "./ToolBasics";

@Component({
    components: {
        accordion: Accordion,
    },
})
export default class FilterTool extends Tool implements ToolBasics {
    name = ToolName.Filter;
    active = false;

    get labels(): { [category: string]: [string, string][] } {
        const cat: { [category: string]: [string, string][] } = { "": [] };
        for (const uuid of Object.keys(gameStore.labels)) {
            const label = gameStore.labels[uuid];
            if (!label.category) cat[""].push([label.uuid, label.name]);
            else {
                if (!(label.category in cat)) cat[label.category] = [];
                cat[label.category].push([label.uuid, label.name]);
                cat[label.category].sort((a, b) => a[1].localeCompare(b[1]));
            }
        }
        return cat;
    }

    get initalValues(): { [category: string]: string[] } {
        const values: { [category: string]: string[] } = {};
        for (const cat of Object.keys(this.labels)) {
            values[cat] = gameStore.labelFilters.filter(f => this.labels[cat].map(l => l[0]).includes(f));
        }
        return values;
    }

    get categories(): string[] {
        return Object.keys(this.labels).sort();
    }

    isFilter(uuid: string): boolean {
        return gameStore.labelFilters.includes(uuid);
    }

    toggleFilter(uuid: string): void {
        const i = gameStore.labelFilters.indexOf(uuid);
        if (i >= 0) gameStore.labelFilters.splice(i, 1);
        else gameStore.labelFilters.push(uuid);
        layerManager.invalidateAllFloors();
    }

    toggleUnlabeled(): void {
        gameStore.toggleUnlabeledFilter();
        layerManager.invalidateAllFloors();
    }

    updateSelection(data: { title: string; selection: string[] }): void {
        if (!(data.title in this.labels)) return;
        for (const [uuid, _] of this.labels[data.title]) {
            const idx = gameStore.labelFilters.indexOf(uuid);
            const selected = data.selection.includes(uuid);
            if (idx >= 0 && !selected) {
                gameStore.labelFilters.splice(idx, 1);
                socket.emit("Labels.Filter.Remove", uuid);
            } else if (idx < 0 && selected) {
                gameStore.labelFilters.push(uuid);
                socket.emit("Labels.Filter.Add", uuid);
            }
        }
        layerManager.invalidateAllFloors();
    }
}
</script>

<template>
    <div class="tool-detail" v-if="selected" :style="{ '--detailRight': detailRight, '--detailArrow': detailArrow }">
        <div id="accordion-container">
            <accordion
                v-for="category in categories"
                :key="category"
                :title="category === '' ? $t('game.ui.tools.filter.no_category') : category"
                :showArrow="false"
                :items="labels[category]"
                :initialValues="initalValues[category]"
                @selectionupdate="updateSelection"
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

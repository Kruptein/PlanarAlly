<template>
    <div
        class="tool-detail"
        v-if="selected"
        :style="{'--detailRight': detailRight, '--detailArrow': detailArrow}"
    >
        <!-- <div class="label" :class="{disabled: $store.state.game.filterNoLabel}">
            <div class='label-main' @click="toggleUnlabeled">Unlabeled</div>
        </div> -->
        <!-- <template v-for="[uuid, label] in labels()">
            <div class="label" :class="{disabled: isFilter(uuid)}" :key="uuid">
                <template v-if="label.name[0] !== ':'">
                    <div
                        class="label-user"
                    >{{ label.name.split(":")[0] }}</div>
                    <div
                        class="label-main"
                        @click="toggleFilter(uuid)"
                    >{{ label.name.split(":").splice(1).join(":") }}</div>
                </template>
                <template v-if="label.name[0] === ':'">
                    <div
                        class="label-main"
                        @click="toggleFilter(uuid)"
                    >{{ label.name.slice(1) }}</div>
                </template>
            </div>
        </template> -->
        <accordion-list>
            <accordion v-for="category in categories" :title="category.name" :showArrow="false" :items="category.items"/>
            <accordion title="test twee" :showArrow="false" :items="['woo', 'test']"/>
        </accordion-list>
    </div>
</template>

<script lang="ts">
import Component from "vue-class-component";

import Accordion from '@/core/components/accordion.vue';
import AccordionList from '@/core/components/accordion_list.vue';
import Tool from "@/game/ui/tools/tool.vue";

import { layerManager } from '@/game/layers/manager';
import { gameStore } from '@/game/store';


@Component({
    components: {
        "accordion": Accordion,
        "accordion-list": AccordionList,
    },
})
export default class FilterTool extends Tool {
    name = "Filter";
    active = false;

    isFilter(uuid: string): boolean {
        return gameStore.labelFilters.includes(uuid);
    }

    categories() {
        
    }

    // Cannot be a computed value due to Map reactivity limits
    labels() {
        const labels = [];
        for (const label of gameStore.labels.values()) labels.push(...Array.from(label));
        return labels;
    }

    toggleFilter(uuid: string) {
        const i = gameStore.labelFilters.indexOf(uuid);
        if (i >= 0) gameStore.labelFilters.splice(i, 1);
        else gameStore.labelFilters.push(uuid);
        layerManager.invalidate();
    }

    toggleUnlabeled() {
        gameStore.toggleUnlabeledFilter();
        layerManager.invalidate();
    }

}
</script>

<style>

</style>


<style scoped>

/* .label {
    display: inline-flex;
    position: relative;
    flex-direction: row;
    align-items: center;
    background-color: white;
    font-size: 10px;
    margin: 5px;
}

.label-user {
    border-top-left-radius: 10px;
    border-bottom-left-radius: 10px;
    background-color: #ff7052;
    border: solid 1px #ff7052;
    padding: 5px;
}

.label-main {
    border: solid 1px #ff7052;
    border-radius: 10px;
    padding: 5px;
}

.label-user + .label-main {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
}

.label:hover {
    cursor: pointer;
}

.disabled, .label:not(.disabled):hover {
    opacity: 0.5;
}

.label:not(.disabled), .disabled:hover {
    opacity: 1.0;
} */
</style>

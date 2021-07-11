<script setup lang="ts">
import { computed, ref, toRef } from "vue";
import { useI18n } from "vue-i18n";
import draggable from "vuedraggable";

import { useModal } from "../../core/plugins/modals/plugin";
import { floorStore } from "../../store/floor";
import { gameStore } from "../../store/game";
import { uiStore } from "../../store/ui";
import { sendCreateFloor } from "../api/emits/floor";
import type { Floor } from "../models/floor";

import { layerTranslationMapping } from "./translations";

const { t } = useI18n();
const modals = useModal();

const floorState = floorStore.state;
const isDm = toRef(gameStore.state, "isDm");

const selectFloor = floorStore.selectFloor.bind(floorStore);
const selectLayer = floorStore.selectLayer.bind(floorStore);
const openSettings = uiStore.showFloorSettings.bind(uiStore);

const visible = computed(() => floorState.floors.length > 1 || isDm.value);
const detailsOpen = ref(false);

// FLOORS

const floorIndex = toRef(floorState, "floorIndex");

const floors = computed({
    get() {
        return [...floorState.floors]
            .reverse()
            .filter((f) => f.playerVisible || isDm.value)
            .map((f) => ({ reverseIndex: floorStore.getFloorIndex({ id: f.id })!, floor: f }));
    },
    set(floors: { reverseIndex: number; floor: Floor }[]) {
        floorStore.reorderFloors(floors.map((f) => f.floor.name).reverse(), true);
    },
});

async function addFloor(): Promise<void> {
    const value = await modals.prompt(t("game.ui.FloorSelect.new_name"), t("game.ui.FloorSelect.creation"), (value) => {
        if (floorState.floors.some((f) => f.name === value)) {
            return { valid: false, reason: "This name is already in use!" };
        }
        return { valid: true };
    });
    if (value === undefined || floorStore.getFloor({ name: value }) !== undefined) return;
    sendCreateFloor(value);
}

function toggleVisible(floor: Floor): void {
    floorStore.setFloorPlayerVisible({ id: floor.id }, !floor.playerVisible, true);
}

// LAYERS

const layers = computed(() => {
    if (!gameStore.state.boardInitialized) return [];
    return floorStore
        .getLayers(floorStore.currentFloor.value!)
        .filter((l) => l.selectable && (isDm.value || l.playerEditable))
        .map((l) => l.name);
});

const selectedLayer = computed(() => floorStore.getLayers(floorStore.currentFloor.value!)[floorState.layerIndex].name);
</script>

<template>
    <div id="floor-layer">
        <div id="floor-selector" @click="detailsOpen = !detailsOpen" v-if="visible">
            <a href="#">{{ floorIndex }}</a>
        </div>
        <div id="floor-detail" v-if="detailsOpen">
            <draggable v-model="floors" :disabled="!isDm" item-key="reverseIndex">
                <template #item="{ element: f }">
                    <div class="floor-row" @click="selectFloor({ name: f.floor.name }, true)">
                        <div
                            class="floor-index"
                            :class="f.reverseIndex == floorIndex ? 'floor-index-selected' : 'floor-index-not-selected'"
                        >
                            {{ f.reverseIndex }}
                        </div>
                        <div class="floor-name">{{ f.floor.name }}</div>
                        <div class="floor-actions" v-if="isDm">
                            <div
                                @click.stop="toggleVisible(f.floor)"
                                :style="{ opacity: f.floor.playerVisible ? 1.0 : 0.3, marginRight: '5px' }"
                                :title="t('game.ui.FloorSelect.toggle_visibility')"
                            >
                                <font-awesome-icon icon="eye" />
                            </div>
                            <div @click="openSettings(f.floor.id)"><font-awesome-icon icon="cog" /></div>
                        </div>
                    </div>
                </template>
            </draggable>
            <div class="floor-add" @click="addFloor" v-if="isDm">{{ t("game.ui.FloorSelect.add_new_floor") }}</div>
        </div>
        <div style="display: contents" v-show="layers.length > 1">
            <div
                v-for="layer in layers"
                class="layer"
                :key="layer"
                :class="{ 'layer-selected': layer === selectedLayer }"
                @mousedown="selectLayer(layer)"
            >
                <a href="#">{{ layerTranslationMapping[layer] }}</a>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
#floor-layer {
    grid-area: layer;
    display: flex;
    list-style: none;
    margin-left: 25px;
    margin-bottom: 25px;
    -webkit-user-drag: none !important;

    * {
        user-select: none !important;
    }
}

#floor-selector {
    margin-right: 50px;
    border-radius: 4px;
}

#floor-selector,
.layer {
    pointer-events: auto;
    background-color: #eee;
    border-right: solid 1px #82c8a0;
}

#floor-selector:hover,
.layer:hover,
.layer-selected {
    background-color: #82c8a0;
}

a {
    padding: 10px;
    text-decoration: none;
    display: inline-block;
}

.layer {
    border: solid 1px #82c8a0;
    border-left: none;

    &:first-of-type {
        border-radius: 4px 0 0 4px;
    }

    &:last-of-type {
        border-radius: 0 4px 4px 0;
    }
}

#floor-detail {
    pointer-events: auto;
    position: absolute;
    left: 25px;
    bottom: 80px;
    border: solid 1px #2b2b2b;
    background-color: white;
    padding: 10px;

    &:after {
        content: "";
        position: absolute;
        left: 15px;
        bottom: 0;
        width: 0;
        height: 0;
        border: 14px solid transparent;
        border-top-color: black;
        border-bottom: 0;
        margin-left: -14px;
        margin-bottom: -14px;
    }

    input {
        width: 100%;
        box-sizing: border-box;
    }
}

.floor-row {
    display: flex;

    > * {
        border: solid 1px rgba(0, 0, 0, 0);
        border-left: 0;
        border-right: 0;
    }

    &:hover > * {
        cursor: pointer;
        border: solid 1px #82c8a0;
        border-left: 0;
        border-right: 0;
    }
}

.floor-index {
    grid-column-start: 1;
    padding-right: 5px;
    border-right: 1px solid black;
    justify-self: end;
    /* width: 25px; */
    text-align: right;
}

.floor-index-selected:before {
    content: ">";
    white-space: pre;
}

.floor-index-not-selected:before {
    content: ">";
    visibility: hidden;
}

.floor-name {
    padding: 0 10px;
    flex-grow: 2;
}

.floor-actions {
    display: flex;
    justify-content: center;
}

.floor-add {
    grid-column: 1 / span 3;
    margin-top: 1em;

    &:hover {
        cursor: pointer;
        border: solid 1px #82c8a0;
        border-left: 0;
        border-right: 0;
    }
}
</style>

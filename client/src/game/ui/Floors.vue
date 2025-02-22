<script setup lang="ts">
import { computed, ref, toRef } from "vue";
import { useI18n } from "vue-i18n";
import draggable from "vuedraggable";

import { baseAdjust } from "../../core/http";
import { useModal } from "../../core/plugins/modals/plugin";
import { sendCreateFloor } from "../api/emits/floor";
import type { Floor, FloorIndex } from "../models/floor";
import { floorSystem } from "../systems/floors";
import { floorState } from "../systems/floors/state";
import { gameState } from "../systems/game/state";
import { playerSettingsState } from "../systems/settings/players/state";
import { uiSystem } from "../systems/ui";

import { layerTranslationMapping } from "./translations";

const { t } = useI18n();
const modals = useModal();

const selectFloor = floorSystem.selectFloor.bind(floorSystem);
const selectLayer = floorSystem.selectLayer.bind(floorSystem);

const visible = computed(() => floorState.reactive.floors.length > 1 || gameState.reactive.isDm);
const detailsOpen = ref(false);

function getStaticFloorImg(img: string): string {
    return baseAdjust(`/static/img/floors/${img}`);
}

// FLOORS

const floorIndex = toRef(floorState.reactive, "floorIndex");

const floors = computed({
    get() {
        return [...floorState.reactive.floors]
            .reverse()
            .filter((f) => f.playerVisible || gameState.reactive.isDm)
            .map((f) => ({ reverseIndex: floorSystem.getFloorIndex({ id: f.id })!, floor: f }));
    },
    set(floors: { reverseIndex: number; floor: Floor }[]) {
        floorSystem.reorderFloors(floors.map((f) => f.floor.name).reverse(), true);
    },
});

async function addFloor(): Promise<void> {
    const value = await modals.prompt(t("game.ui.FloorSelect.new_name"), t("game.ui.FloorSelect.creation"), (value) => {
        if (floorState.raw.floors.some((f) => f.name === value)) {
            return { valid: false, reason: "This name is already in use!" };
        }
        return { valid: true };
    });
    if (value === undefined || floorSystem.getFloor({ name: value }) !== undefined) return;
    sendCreateFloor(value);
}

function toggleVisible(floor: Floor): void {
    floorSystem.setFloorPlayerVisible({ id: floor.id }, !floor.playerVisible, true);
}

// LAYERS

const layers = computed(() => {
    if (!gameState.reactive.boardInitialized) return [];
    return floorSystem
        .getLayers(floorState.currentFloor.value!)
        .filter((l) => l.selectable && (gameState.reactive.isDm || l.playerEditable))
        .map((l) => l.name);
});

const selectedLayer = computed(() => {
    const floor = floorState.currentFloor.value;
    if (floor === undefined) return undefined;
    return floorSystem.getLayers(floor)[floorState.reactive.layerIndex]?.name ?? undefined;
});
</script>

<template>
    <div id="floor-layer">
        <div
            v-if="visible"
            id="floor-selector"
            :title="t('game.ui.FloorSelect.title')"
            @click="detailsOpen = !detailsOpen"
        >
            <a href="#">
                <template v-if="playerSettingsState.reactive.useToolIcons.value">
                    <img :src="getStaticFloorImg('floors.svg')" alt="Floor Selection" />
                </template>
                <template v-else>{{ floorIndex }}</template>
            </a>
        </div>
        <div v-if="detailsOpen" id="floor-detail">
            <draggable v-model="floors" :disabled="!gameState.reactive.isDm" item-key="reverseIndex">
                <template #item="{ element: f }: { element: { floor: Floor; reverseIndex: FloorIndex } }">
                    <div class="floor-row" @click="selectFloor({ name: f.floor.name }, true)">
                        <div
                            class="floor-index"
                            :class="f.reverseIndex == floorIndex ? 'floor-index-selected' : 'floor-index-not-selected'"
                        >
                            {{ f.reverseIndex }}
                        </div>
                        <div class="floor-name">{{ f.floor.name }}</div>
                        <div v-if="gameState.reactive.isDm" class="floor-actions">
                            <div
                                :style="{ opacity: f.floor.playerVisible ? 1.0 : 0.3, marginRight: '5px' }"
                                :title="t('game.ui.FloorSelect.toggle_visibility')"
                                @click.stop="toggleVisible(f.floor)"
                            >
                                <font-awesome-icon icon="eye" />
                            </div>
                            <div @click="uiSystem.showFloorSettings(f.floor.id)"><font-awesome-icon icon="cog" /></div>
                        </div>
                    </div>
                </template>
            </draggable>
            <div v-if="gameState.reactive.isDm" class="floor-add" @click="addFloor">
                {{ t("game.ui.FloorSelect.add_new_floor") }}
            </div>
        </div>
        <div v-show="layers.length > 1" style="display: contents">
            <div
                v-for="layer in layers"
                :key="layer"
                class="layer"
                :class="{ 'layer-selected': layer === selectedLayer }"
                @click="selectLayer(layer)"
            >
                <a href="#" :title="layerTranslationMapping[layer]">
                    <template v-if="playerSettingsState.reactive.useToolIcons.value">
                        <img
                            :src="getStaticFloorImg(`${layer.toLowerCase()}.svg`)"
                            :alt="layerTranslationMapping[layer]"
                        />
                    </template>
                    <template v-else>{{ layerTranslationMapping[layer] }}</template>
                </a>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
#floor-layer {
    display: flex;
    list-style: none;
    margin-top: 1rem;
    margin-left: 1.5rem;
    margin-bottom: 1.5rem;
    -webkit-user-drag: none !important;

    * {
        user-select: none !important;
    }
}

#floor-selector {
    margin-right: 3.125rem;
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
    padding: 0.625rem;
    text-decoration: none;
    display: flex;
    justify-content: center;
    align-items: center;

    > img {
        height: 2.5rem;
        width: 2.5rem;
    }
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
    bottom: 4.75rem;
    border: solid 1px #2b2b2b;
    background-color: white;
    padding: 0.625rem;

    &:after {
        content: "";
        position: absolute;
        left: 1.75rem;
        bottom: 0;
        width: 0;
        height: 0;
        border: 14px solid transparent;
        border-top-color: black;
        border-bottom: 0;
        margin-left: -0.875rem;
        margin-bottom: -0.875rem;
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
    padding-right: 0.3rem;
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
    padding: 0 0.625rem;
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

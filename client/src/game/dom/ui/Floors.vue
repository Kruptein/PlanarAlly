<script setup lang="ts">
import { computed, ref, toRef } from "vue";
import { useI18n } from "vue-i18n";
import draggable from "vuedraggable";

import { baseAdjust } from "../../../core/http";
// import { useModal } from "../../../core/plugins/modals/plugin";
// import { sendCreateFloor } from "../../core/api/emits/floor";
// import type { Floor, FloorIndex } from "../../core/models/floor";
// import { floorSystem } from "../../core/systems/floors";
import type { Floor, FloorId, FloorIndex, LayerName } from "../../core/models/floor";
import { playerSettingsState } from "../../core/systems/settings/players/state";
import { uiSystem } from "../../core/systems/ui";
import { postRender } from "../../messages/render";
import { uiFloorState } from "../state/floor";
import { uiGameState } from "../state/game";

import { layerTranslationMapping } from "./translations";

const { t } = useI18n();
// const modals = useModal();

const visible = computed(() => uiFloorState.reactive.floors.length > 1 || uiGameState.reactive.isDm);
const detailsOpen = ref(false);

function getStaticFloorImg(img: string): string {
    return baseAdjust(`/static/img/floors/${img}`);
}

// FLOORS

const floorIndex = toRef(uiFloorState.reactive, "floorIndex");

const floors = computed({
    get() {
        return [...uiFloorState.reactive.floors]
            .reverse()
            .filter((f) => f.playerVisible || uiGameState.reactive.isDm)
            .map((f) => ({ reverseIndex: uiFloorState.raw.floors.findIndex((f2) => f.id === f2.id), floor: f }));
    },
    set(floors: { reverseIndex: number; floor: Floor }[]) {
        // floorSystem.reorderFloors(floors.map((f) => f.floor.name).reverse(), true);
    },
});

// async function addFloor(): Promise<void> {
//     const value = await modals.prompt(t("game.ui.FloorSelect.new_name"), t("game.ui.FloorSelect.creation"), (value) => {
//         if (floorState.readonly.floors.some((f) => f.name === value)) {
//             return { valid: false, reason: "This name is already in use!" };
//         }
//         return { valid: true };
//     });
//     if (value === undefined || floorSystem.getFloor({ name: value }) !== undefined) return;
//     sendCreateFloor(value);
// }

function toggleVisible(floor: Floor): void {
    // floorSystem.setFloorPlayerVisible({ id: floor.id }, !floor.playerVisible, true);
}

async function selectFloor(id: FloorId): Promise<void> {
    await postRender("Floor.Select", id);
}

// LAYERS

const layers = computed(() => {
    return uiFloorState.reactive.layers
        .map((l, i) => ({ name: l.name, available: l.available, index: i }))
        .filter((l) => l.available);
});

async function selectLayer(name: LayerName): Promise<void> {
    await postRender("Layer.Select", { name });
}
</script>

<template>
    <div id="floor-layer">
        <div v-if="visible" id="floor-selector" title="Floor selection" @click="detailsOpen = !detailsOpen">
            <a href="#">
                <template v-if="playerSettingsState.reactive.useToolIcons.value">
                    <img :src="getStaticFloorImg('floors.svg')" alt="Floor Selection" />
                </template>
                <template v-else>{{ floorIndex }}</template>
            </a>
        </div>
        <div v-if="detailsOpen" id="floor-detail">
            <draggable v-model="floors" :disabled="!uiGameState.reactive.isDm" item-key="reverseIndex">
                <template #item="{ element: f }: { element: { floor: Floor, reverseIndex: FloorIndex } }">
                    <div class="floor-row" @click="selectFloor(f.floor.id)">
                        <div
                            class="floor-index"
                            :class="f.reverseIndex == floorIndex ? 'floor-index-selected' : 'floor-index-not-selected'"
                        >
                            {{ f.reverseIndex }}
                        </div>
                        <div class="floor-name">{{ f.floor.name }}</div>
                        <div v-if="uiGameState.reactive.isDm" class="floor-actions">
                            <div
                                :style="{ opacity: f.floor.playerVisible ? 1.0 : 0.3, marginRight: '5px' }"
                                :title="t('game.ui.FloorSelect.toggle_visibility')"
                                @click.stop="toggleVisible(f.floor)"
                            >
                                <font-awesome-icon icon="eye" />
                            </div>
                            <div @click.stop="uiSystem.showFloorSettings(f.floor.id)">
                                <font-awesome-icon icon="cog" />
                            </div>
                        </div>
                    </div>
                </template>
            </draggable>
            <!-- <div v-if="uiGameState.reactive.isDm" class="floor-add" @click="addFloor">
                {{ t("game.ui.FloorSelect.add_new_floor") }}
            </div> -->
        </div>
        <div v-show="layers.length > 1" style="display: contents">
            <div
                v-for="layer in layers"
                :key="layer.name"
                class="layer"
                :class="{ 'layer-selected': layer.index === uiFloorState.reactive.layerIndex }"
                @click="selectLayer(layer.name)"
            >
                <a href="#" :title="layerTranslationMapping[layer.name]">
                    <template v-if="playerSettingsState.reactive.useToolIcons.value">
                        <img
                            :src="getStaticFloorImg(`${layer.name.toLowerCase()}.svg`)"
                            :alt="layerTranslationMapping[layer.name]"
                        />
                    </template>
                    <template v-else>{{ layerTranslationMapping[layer.name] }}</template>
                </a>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
#floor-layer {
    position: relative;
    grid-area: layer;
    display: flex;
    list-style: none;
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

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import Game from "@/game/game.vue";

import { socket } from "@/game/api/socket";
import { layerManager } from "@/game/layers/manager";
import { removeFloor } from "@/game/layers/utils";
import { gameStore } from "@/game/store";

@Component
export default class FloorSelect extends Vue {
    selected = false;

    get IS_DM(): boolean {
        return gameStore.IS_DM || gameStore.FAKE_PLAYER;
    }

    get floors(): string[] {
        return gameStore.floors;
    }

    get selectedFloorIndex(): number {
        return gameStore.selectedFloorIndex;
    }

    get layers(): string[] {
        return gameStore.layers;
    }

    get selectedLayer(): string {
        return gameStore.selectedLayer;
    }

    get showFloorSelector(): boolean {
        return this.floors.length > 1 || this.IS_DM;
    }

    selectLayer(layer: string): void {
        layerManager.selectLayer(layer);
    }

    async addFloor(): Promise<void> {
        const value = await (<Game>this.$parent.$parent).$refs.prompt.prompt(
            this.$t("game.ui.floors.new_name").toString(),
            this.$t("game.ui.floors.creation").toString(),
        );
        if (value === undefined) return;
        socket.emit("Floor.Create", value);
    }

    selectFloor(index: number): void {
        gameStore.selectFloor({ targetFloor: index, sync: true });
    }

    async removeFloor(index: number): Promise<void> {
        if (this.floors.length <= 1) return;
        const floor = gameStore.floors[index];
        if (
            !(await (<Game>this.$parent.$parent).$refs.confirm.open(
                this.$t("common.warning").toString(),
                this.$t("game.ui.floors.warning_msg_Z", { z: floor }).toString(),
            ))
        )
            return;
        socket.emit("Floor.Remove", floor);
        removeFloor(floor);
    }

    getLayerWord(layer: string): string {
        switch (layer) {
            case "map":
                return this.$t("layer.map").toString();

            case "tokens":
                return this.$t("layer.tokens").toString();

            case "dm":
                return this.$t("layer.dm").toString();

            case "fow":
                return this.$t("layer.fow").toString();

            default:
                return "";
        }
    }
}
</script>

<template>
    <div id="floor-layer">
        <div id="floor-selector" @click="selected = !selected" v-if="showFloorSelector">
            <a href="#">{{ selectedFloorIndex }}</a>
        </div>
        <div id="floor-detail" v-if="selected">
            <template v-for="[index, floor] of floors.entries()">
                <div class="floor-row" :key="floor" @click="selectFloor(index)">
                    <div class="floor-index">
                        <template v-if="index == selectedFloorIndex">></template>
                        {{ index }}
                    </div>
                    <div class="floor-name">{{ floor }}</div>
                    <div class="floor-actions" v-show="floors.length > 1 && IS_DM">
                        <div @click.stop="removeFloor(index)" :title="$t('game.ui.floors.delete_floor')">
                            <i aria-hidden="true" class="fas fa-trash-alt"></i>
                        </div>
                    </div>
                </div>
            </template>
            <div class="floor-add" @click="addFloor" v-if="IS_DM" v-t="'game.ui.floors.add_new_floor'"></div>
        </div>
        <div style="display:contents" v-show="layers.length > 1">
            <div
                v-for="layer in layers"
                class="layer"
                :key="layer"
                :class="{ 'layer-selected': layer === selectedLayer }"
                @mousedown="selectLayer(layer)"
            >
                <a href="#">{{ getLayerWord(layer) }}</a>
            </div>
        </div>
    </div>
</template>

<style scoped>
#floor-layer {
    grid-area: layer;
    display: flex;
    list-style: none;
    margin-left: 25px;
    margin-bottom: 25px;
}

#floor-layer * {
    user-select: none !important;
    -webkit-user-drag: none !important;
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
}

.layer:first-of-type {
    border-radius: 4px 0 0 4px;
}

.layer:last-of-type {
    border-radius: 0 4px 4px 0;
}

#floor-detail {
    pointer-events: auto;
    position: absolute;
    left: 25px;
    bottom: 80px;
    z-index: 11;
    border: solid 1px #2b2b2b;
    background-color: white;
    display: grid;
    padding: 10px;
    grid-template-columns: auto auto auto;
    grid-row-gap: 2px;
}
#floor-detail:after {
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

#floor-detail input {
    width: 100%;
    box-sizing: border-box;
}

.floor-row {
    display: contents;
}

.floor-row > * {
    border: solid 1px rgba(0, 0, 0, 0);
    border-left: 0;
    border-right: 0;
}

.floor-row:hover > * {
    cursor: pointer;
    border: solid 1px #82c8a0;
    border-left: 0;
    border-right: 0;
}

.floor-index {
    grid-column-start: 1;
    padding-right: 5px;
    border-right: 1px solid black;
    justify-self: end;
}

.floor-name {
    padding: 0 10px;
}

.floor-actions {
    display: flex;
    justify-content: center;
}

.floor-add {
    grid-column: 1 / span 3;
    margin-top: 1em;
}

.floor-add:hover {
    cursor: pointer;
    border: solid 1px #82c8a0;
    border-left: 0;
    border-right: 0;
}
</style>

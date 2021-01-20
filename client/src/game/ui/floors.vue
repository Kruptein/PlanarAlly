<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import draggable from "vuedraggable";

import ConfirmDialog from "@/core/components/modals/confirm.vue";
import Prompt from "@/core/components/modals/prompt.vue";

import { layerManager } from "@/game/layers/manager";
import { removeFloor } from "@/game/layers/utils";
import { gameStore } from "@/game/store";
import { Floor } from "../layers/floor";
import { floorStore, getFloorId } from "../layers/store";
import { sendCreateFloor, sendRemoveFloor, sendFloorSetVisible } from "../api/emits/floor";

@Component({
    components: {
        ConfirmDialog,
        draggable,
        Prompt,
    },
})
export default class FloorSelect extends Vue {
    $refs!: {
        confirm: ConfirmDialog;
        prompt: Prompt;
    };

    selected = false;

    get IS_DM(): boolean {
        return gameStore.IS_DM || gameStore.FAKE_PLAYER;
    }

    get floors(): readonly [number, Floor][] {
        return [...floorStore.floors]
            .reverse()
            .filter((f) => f.playerVisible || gameStore.IS_DM)
            .map((f) => [floorStore.floors.indexOf(f), f]);
    }

    set floors(floors: readonly [number, Floor][]) {
        floorStore.reorderFloors({ floors: floors.map((f) => f[1].name).reverse(), sync: true });
    }

    get selectedFloorIndex(): number {
        return floorStore.currentFloorindex;
    }

    get layers(): string[] {
        if (!gameStore.boardInitialized) return [];
        return layerManager
            .getLayers(floorStore.currentFloor)
            .filter((l) => l.selectable && (gameStore.IS_DM || l.playerEditable))
            .map((l) => l.name);
    }

    get selectedLayer(): string {
        return layerManager.getLayers(floorStore.currentFloor)[floorStore.currentLayerIndex].name;
    }

    get showFloorSelector(): boolean {
        return this.floors.length > 1 || this.IS_DM;
    }

    selectLayer(layer: string): void {
        layerManager.selectLayer(layer);
    }

    async addFloor(): Promise<void> {
        const value = await this.$refs.prompt.prompt(
            this.$t("game.ui.floors.new_name").toString(),
            this.$t("game.ui.floors.creation").toString(),
        );
        if (value === undefined) return;
        sendCreateFloor(value);
    }

    selectFloor(floor: Floor): void {
        floorStore.selectFloor({ targetFloor: floor, sync: true });
    }

    async renameFloor(index: number): Promise<void> {
        const value = await this.$refs.prompt.prompt(
            this.$t("game.ui.floors.new_name").toString(),
            this.$t("game.ui.floors.rename_header_title").toString(),
        );
        if (value === undefined || getFloorId(value) !== -1) return;
        floorStore.renameFloor({ index, name: value, sync: true });
    }

    async removeFloor(floor: Floor): Promise<void> {
        if (this.floors.length <= 1) return;
        if (
            !(await this.$refs.confirm.open(
                this.$t("common.warning").toString(),
                this.$t("game.ui.floors.warning_msg_Z", { z: floor.name }).toString(),
            ))
        )
            return;
        sendRemoveFloor(floor.name);
        removeFloor(floor.id);
    }

    toggleVisible(floor: Floor): void {
        floor.playerVisible = !floor.playerVisible;
        sendFloorSetVisible({ name: floor.name, visible: floor.playerVisible });
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
        <ConfirmDialog ref="confirm"></ConfirmDialog>
        <Prompt ref="prompt"></Prompt>
        <div id="floor-selector" @click="selected = !selected" v-if="showFloorSelector">
            <a href="#">{{ selectedFloorIndex }}</a>
        </div>
        <draggable id="floor-detail" v-if="selected" v-model="floors" :disabled="!$store.state.game.IS_DM">
            <template v-for="[revIndex, floor] of floors">
                <div class="floor-row" :key="floor.id" @click="selectFloor(floor)">
                    <div
                        class="floor-index"
                        :class="revIndex == selectedFloorIndex ? 'floor-index-selected' : 'floor-index-not-selected'"
                    >
                        {{ revIndex }}
                    </div>
                    <div class="floor-name">{{ floor.name }}</div>
                    <div class="floor-actions" v-show="IS_DM">
                        <div @click.stop="renameFloor(revIndex)" :title="$t('game.ui.floors.rename_icon_hover')">
                            <font-awesome-icon icon="pencil-alt" />
                        </div>
                        <div
                            @click.stop="toggleVisible(floor)"
                            :style="{ opacity: floor.playerVisible ? 1.0 : 0.3, marginRight: '5px' }"
                            :title="$t('game.ui.floors.toggle_visibility')"
                        >
                            <font-awesome-icon icon="eye" />
                        </div>
                        <div
                            @click.stop="removeFloor(floor)"
                            v-show="floors.length > 1"
                            :title="$t('game.ui.floors.delete_floor')"
                        >
                            <font-awesome-icon icon="trash-alt" />
                        </div>
                    </div>
                </div>
            </template>
            <div class="floor-add" @click="addFloor" v-if="IS_DM" v-t="'game.ui.floors.add_new_floor'"></div>
        </draggable>
        <div style="display: contents" v-show="layers.length > 1">
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
    z-index: 11;
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

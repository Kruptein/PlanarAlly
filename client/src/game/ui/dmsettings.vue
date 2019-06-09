<template>
    <Modal :visible="visible" @close="visible = false" :mask="false">
        <div
            class="modal-header"
            slot="header"
            slot-scope="m"
            draggable="true"
            @dragstart="m.dragStart"
            @dragend="m.dragEnd"
        >
            <div>DM Settings</div>
            <div class="header-close" @click="visible = false">
                <i class="far fa-window-close"></i>
            </div>
        </div>
        <div class="modal-body" @click="handleClick">
            <div id="categories">
                <div
                    class="category"
                    :class="{'selected': selection === c}"
                    v-for="(category, c) in categories"
                    :key="category"
                    @click="selection = c"
                >{{ category }}</div>
            </div>
            <div class="panel" v-show="selection === 0">
                <!-- <div class="header">List of players</div> -->
                <div class="admin-player" style="grid-column-start: setting">darragh</div>
                <div class="admin-player">Kick</div>
                <div class="admin-player" style="grid-column-start: setting">test</div>
                <div class="admin-player">Kick</div>
                <div class="row">
                    <label for="invitation">Invitation Code:</label>
                    <div>
                        <input
                            id="invitation"
                            type="text"
                            :value="invitationCode"
                            readonly="readonly"
                        >
                    </div>
                </div>
            </div>
            <div class="panel" v-show="selection === 1">
                <div class="row">
                    <label for="useGridInput">Use grid</label>
                    <div>
                        <input id="useGridInput" type="checkbox" v-model="useGrid">
                    </div>
                </div>
                <div class="row">
                    <label for="gridSizeInput">Grid Size (in pixels):</label>
                    <div>
                        <input id="gridSizeInput" type="number" min="0" v-model.number="gridSize">
                    </div>
                </div>
                <div class="row">
                    <label for="unitSizeInput">Unit Size (in ft.):</label>
                    <div>
                        <input id="unitSizeInput" type="number" v-model.number="unitSize">
                    </div>
                </div>
            </div>
            <div class="panel" v-show="selection === 2">
                <div class="row">
                    <label for="fakePlayerInput">Fake player:</label>
                    <div>
                        <input id="fakePlayerInput" type="checkbox" v-model="fakePlayer">
                    </div>
                </div>
                <div class="row">
                    <label for="useFOWInput">Fill entire canvas with FOW:</label>
                    <div>
                        <input id="useFOWInput" type="checkbox" v-model="fullFOW">
                    </div>
                </div>
                <div class="row">
                    <label for="fowLOS">Only show lights in LoS:</label>
                    <div>
                        <input id="fowLOS" type="checkbox" v-model="fowLOS">
                    </div>
                </div>
                <div class="row">
                    <label for="visionMode">Vision Mode:</label>
                    <div>
                        <select id="visionMode" @change="changeVisionMode">
                            <option :selected="$store.state.game.visionMode === 'bvh'">BVH</option>
                            <option :selected="$store.state.game.visionMode === 'triangle'">Triangle</option>
                        </select>
                    </div>
                </div>
                <div class="row">
                    <label for="fowOpacity">FOW opacity:</label>
                    <div>
                        <input
                            id="fowOpacity"
                            type="number"
                            min="0"
                            max="1"
                            step="0.1"
                            v-model.number="fowOpacity"
                        >
                    </div>
                </div>
                <div class="row">
                    <label for="vmininp">Minimal full vision (ft):</label>
                    <div>
                        <input
                            id="vmininp"
                            type="number"
                            min="0"
                            v-model.lazy.number="visionRangeMin"
                        >
                    </div>
                </div>
                <div class="row">
                    <label for="vmaxinp">Maximal vision (ft):</label>
                    <div>
                        <input
                            id="vmaxinp"
                            type="number"
                            min="0"
                            v-model.lazy.number="visionRangeMax"
                        >
                    </div>
                </div>
            </div>
        </div>
    </Modal>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import Modal from "@/core/components/modals/modal.vue";

import { uuidv4 } from "@/core/utils";
import { socket } from "@/game/api/socket";
import { EventBus } from "@/game/event-bus";
import { gameStore } from "@/game/store";
import { layerManager } from "../layers/manager";
import { mapState } from "vuex";

@Component({
    components: {
        Modal,
    },
    computed: {
        ...mapState("game", ["invitationCode"]),
    },
})
export default class DmSettings extends Vue {
    visible = true;
    categories = ["Admin", "Grid", "Vision"];
    selection = 0;

    mounted() {
        EventBus.$on("DmSettings.Open", () => {
            this.visible = true;
        });
    }

    beforeDestroy() {
        EventBus.$off("DmSettings.Open");
    }

    // Grid
    get useGrid(): boolean {
        return gameStore.useGrid;
    }
    set useGrid(value: boolean) {
        gameStore.setUseGrid({ useGrid: value, sync: true });
    }
    get unitSize(): number {
        return gameStore.unitSize;
    }
    set unitSize(value: number) {
        if (typeof value !== "number") return;
        gameStore.setUnitSize({ unitSize: value, sync: true });
    }
    get gridSize(): number {
        return gameStore.gridSize;
    }
    set gridSize(value: number) {
        if (typeof value !== "number") return;
        gameStore.setGridSize({ gridSize: value, sync: true });
    }
    // Vision
    get fakePlayer(): boolean {
        return gameStore.FAKE_PLAYER;
    }
    set fakePlayer(value: boolean) {
        gameStore.setFakePlayer(value);
    }
    get fullFOW(): boolean {
        return gameStore.fullFOW;
    }
    set fullFOW(value: boolean) {
        gameStore.setFullFOW({ fullFOW: value, sync: true });
    }
    get fowOpacity(): number {
        return gameStore.fowOpacity;
    }
    set fowOpacity(value: number) {
        if (typeof value !== "number") return;
        gameStore.setFOWOpacity({ fowOpacity: value, sync: true });
    }
    get fowLOS(): boolean {
        return gameStore.fowLOS;
    }
    set fowLOS(value: boolean) {
        gameStore.setLineOfSight({ fowLOS: value, sync: true });
    }
    get visionRangeMin(): number {
        return gameStore.visionRangeMin;
    }
    set visionRangeMin(value: number) {
        if (typeof value !== "number") return;
        gameStore.setVisionRangeMin({ value, sync: true });
    }
    get visionRangeMax(): number {
        return gameStore.visionRangeMax;
    }
    set visionRangeMax(value: number) {
        if (typeof value !== "number") return;
        gameStore.setVisionRangeMax({ value, sync: true });
    }
    changeVisionMode(event: { target: HTMLSelectElement }) {
        const value = event.target.value.toLowerCase();
        if (value !== "bvh" && value !== "triangle") return;
        gameStore.setVisionMode({ mode: value, sync: true });
        gameStore.recalculateVision();
        gameStore.recalculateMovement();
        layerManager.invalidate();
    }
    handleClick(event: { target: HTMLElement }) {
        const child = event.target.firstElementChild;
        if (child instanceof HTMLInputElement) {
            child.click();
        }
    }
}
</script>

<style scoped>
.modal-header {
    background-color: #ff7052;
    padding: 10px;
    font-size: 20px;
    font-weight: bold;
    cursor: move;
}

.header-close {
    position: absolute;
    top: 5px;
    right: 5px;
}

.modal-body {
    display: flex;
    flex-direction: row;
}

* {
    box-sizing: border-box;
}

#categories {
    width: 7.5em;
    background-color: lightgoldenrodyellow;
    border-right: solid 1px #82c8a0;
}

.category {
    border-bottom: solid 1px #82c8a0;
    padding: 5px;
    text-align: right;
    background-color: white;
    padding-right: 10px;
}

.selected,
.category:hover {
    background-color: #82c8a0;
    font-weight: bold;
    cursor: pointer;
    padding-right: 5px;
}

.panel {
    padding-left: 1em;
    padding-right: 1em;
    display: grid;
    grid-template-columns: [setting] 1fr [value] 1fr [end];
    /* align-items: center; */
    align-content: start;
    min-height: 10em;
}

.row > *,
.panel > *:not(.row) {
    display: flex;
    /* justify-content: center; */
    align-items: center;
    padding: 0.5em;
}

.row:first-of-type > * {
    margin-top: 0.5em;
}

.row:last-of-type > * {
    margin-bottom: 0.5em;
}

input[type="checkbox"] {
    width: 16px;
    height: 23px;
    margin: 0;
    white-space: nowrap;
    display: inline-block;
}

input[type="number"],
input[type="text"] {
    width: 100%;
}

.admin-player:first-of-type,
.admin-player:nth-of-type(2) {
    margin-top: 0.5em;
    padding-top: 1em;
}

.admin-player {
    height: 5px;
    padding-bottom: 0;
    padding-left: 1em;
}

.row {
    display: contents;
}

.row:hover > * {
    cursor: pointer;
    text-shadow: 0px 0px 1px black;
}

.header {
    line-height: 0.1em;
    margin: 20px 0 15px;
}
.header:after {
    position: absolute;
    right: 5px;
    width: 75%;
    border-bottom: 1px solid #000;
    content: "";
}
</style>
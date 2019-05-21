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
        <div class="modal-body">
            <div id="categories">
                <div class="category" :class="{'selected': selection === c}" v-for="(category, c) in categories" :key="category" @click="selection = c">{{ category }}</div>
            </div>
            <div class="panel" v-show="selection === 0">
                Admin panel
            </div>
            <div class="panel" v-show="selection === 1">
                <div class='row'>
                    <label for="useGridInput">Use grid</label>
                    <div><input id="useGridInput" type="checkbox" v-model="useGrid"></div>
                </div>
                <div class='row'>
                    <label for="unitSizeInput">Unit Size (in ft.):</label>
                    <div><input id="unitSizeInput" type="number" v-model.number="unitSize"></div>
                </div>
                <div class='row'>
                    <label for="gridSizeInput">Grid Size (in pixels):</label>
                    <div><input id="gridSizeInput" type="number" min="0" v-model.number="gridSize"></div>
                </div>
            </div>
            <div class="panel" v-show="selection === 2">
                Vision panel
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

@Component({
    components: {
        Modal,
    },
})
export default class DmSettings extends Vue {
    visible = true;
    categories = ["Admin", "Grid", "Vision"]
    selection = 0

    mounted() {
        EventBus.$on("DmSettings.Open", () => {
            this.visible = true;
        });
    }

    beforeDestroy() {
        EventBus.$off("DmSettings.Open");
    }

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
    max-width: 450px;
    display: flex;
    flex-direction: row;
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

.selected, .category:hover {
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
    /* align-content: start; */
    min-height:10em;
}

.row > * {
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
    margin: 0 8px;
    white-space: nowrap;
    display: inline-block;
}

input[type="number"] {
    width: 100%;
}

.row {
    display: contents;
}

.row:hover *{
    border-top: solid 1px #82c8a0;
    border-bottom: solid 1px #82c8a0;
    cursor: pointer;
}

.row:hover > *:first-child {
    border-top-left-radius: 15px;
    border-bottom-left-radius: 15px;
    border-left: solid 1px #82c8a0;
}

.row:hover > *:last-child {
    border-top-right-radius: 15px;
    border-bottom-right-radius: 15px;
    border-right: solid 1px #82c8a0;
}

</style>
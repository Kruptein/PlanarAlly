<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import AdminDmSettings from "./admin.vue";
import GridDmSettings from "./grid.vue";
import Modal from "@/core/components/modals/modal.vue";
import PermissionsDmSettings from "./permissions.vue";
import VisionDmSettings from "./vision.vue";

import { EventBus } from "@/game/event-bus";

@Component({
    components: {
        AdminDmSettings,
        GridDmSettings,
        Modal,
        PermissionsDmSettings,
        VisionDmSettings,
    },
})
export default class DmSettings extends Vue {
    visible = false;
    categories = ["Admin", "Grid", "Vision", "Permissions"];
    selection = 0;

    mounted(): void {
        EventBus.$on("DmSettings.Open", () => {
            this.visible = true;
        });
    }

    beforeDestroy(): void {
        EventBus.$off("DmSettings.Open");
    }

    handleClick(event: { target: HTMLElement }): void {
        const child = event.target.firstElementChild;
        if (child instanceof HTMLInputElement) {
            child.click();
        }
    }
}
</script>

<template>
    <Modal :visible="visible" :colour="'rgba(255, 255, 255, 0.8)'" @close="visible = false" :mask="false">
        <div
            class="modal-header"
            slot="header"
            slot-scope="m"
            draggable="true"
            @dragstart="m.dragStart"
            @dragend="m.dragEnd"
        >
            <div>DM Settings</div>
            <div class="header-close" @click="visible = false" title="Close">
                <i class="far fa-window-close"></i>
            </div>
        </div>
        <div class="modal-body" @click="handleClick">
            <div id="categories">
                <div
                    class="category"
                    :class="{ selected: selection === c }"
                    v-for="(category, c) in categories"
                    :key="category"
                    @click="selection = c"
                >
                    {{ category }}
                </div>
            </div>
            <AdminDmSettings v-show="selection === 0"></AdminDmSettings>
            <GridDmSettings v-show="selection === 1"></GridDmSettings>
            <VisionDmSettings v-show="selection === 2"></VisionDmSettings>
            <PermissionsDmSettings v-show="selection === 3"></PermissionsDmSettings>
        </div>
    </Modal>
</template>

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
    background-color: rgba(0, 0, 0, 0);
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

::v-deep .panel {
    background-color: white;
    padding-left: 1em;
    padding-right: 1em;
    display: grid;
    grid-template-columns: [setting] 1fr [value] 1fr [end];
    /* align-items: center; */
    align-content: start;
    min-height: 10em;
}

::v-deep .row {
    display: contents;
}

::v-deep .row > *,
::v-deep .panel > *:not(.row) {
    display: flex;
    /* justify-content: center; */
    align-items: center;
    padding: 0.5em;
}

::v-deep .row:first-of-type > * {
    margin-top: 0.5em;
}

::v-deep .row:last-of-type > * {
    margin-bottom: 0.5em;
}

::v-deep .row:hover > * {
    cursor: pointer;
    text-shadow: 0px 0px 1px black;
}

::v-deep .smallrow > * {
    padding: 0.2em;
}

::v-deep .header {
    line-height: 0.1em;
    margin: 20px 0 15px;
    font-style: italic;
    overflow: hidden;
}
::v-deep .header:after {
    position: relative;
    width: 100%;
    border-bottom: 1px solid #000;
    content: "";
    margin-right: -100%;
    margin-left: 10px;
    display: inline-block;
}

::v-deep .spanrow {
    grid-column: 1 / end;
}

::v-deep input[type="checkbox"] {
    width: 16px;
    height: 23px;
    margin: 0;
    white-space: nowrap;
    display: inline-block;
}

::v-deep input[type="number"],
::v-deep input[type="text"] {
    width: 100%;
}
::v-deep button {
    padding: 6px 12px;
    border: 1px solid lightgray;
    border-radius: 0.25em;
    background-color: rgb(235, 235, 228);
}
</style>

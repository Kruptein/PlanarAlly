<template>
    <div id="main" @mouseleave="mouseleave" @wheel="zoom">
        <menu-bar v-if="showUI"></menu-bar>
        <div id="board">
            <template v-if="ready.manager">
                <tool-bar ref="tools" v-show="showUI"></tool-bar>
            </template>
            <div
                id="layers"
                @mousedown="mousedown"
                @mouseup="mouseup"
                @mousemove="mousemove"
                @contextmenu.prevent.stop="contextmenu"
                @dragover.prevent
                @drop.prevent.stop="drop"
                @touchmove="touchmove"
                @touchstart="touchstart"
                @touchend="touchend"
            ></div>
            <floor-select v-show="showUI"></floor-select>
        </div>
        <selection-info ref="selectionInfo" v-show="showUI"></selection-info>
        <initiative-dialog ref="initiative" id="initiativedialog"></initiative-dialog>
        <note-dialog ref="note"></note-dialog>
        <label-dialog ref="labels"></label-dialog>
        <dm-settings ref="dmsettings" v-if="IS_DM || FAKE_PLAYER"></dm-settings>
        <!-- When updating zoom boundaries, also update store updateZoom function;
        should probably do this using a store variable-->
        <zoom-slider
            id="zoomer"
            v-model="zoomDisplay"
            v-show="showUI"
            :height="6"
            :width="200"
            :min="0"
            :max="1"
            :interval="0.1"
            :dot-size="[8, 20]"
            :dot-options="{ style: { 'border-radius': '15%', 'z-index': 11 } }"
            :tooltip-placement="'bottom'"
            :tooltip="'focus'"
            :tooltip-formatter="zoomDisplay.toFixed(1)"
            :rail-style="{ 'background-color': '#fff', 'box-shadow': '0.5px 0.5px 3px 1px rgba(0, 0, 0, .36)' }"
            :process-style="{ 'background-color': '#fff' }"
        ></zoom-slider>
        <prompt-dialog ref="prompt"></prompt-dialog>
        <confirm-dialog ref="confirm"></confirm-dialog>
    </div>
</template>

<script lang="ts">
import throttle from "lodash/throttle";
import Vue from "vue";
import Component from "vue-class-component";
import vueSlider from "vue-slider-component";
import "vue-slider-component/theme/default.css";

import "@/game/api/events";

import ConfirmDialog from "@/core/components/modals/confirm.vue";
import Prompt from "@/core/components/modals/prompt.vue";
import Initiative from "@/game/ui/initiative/initiative.vue";
import FloorSelect from "@/game/ui/floors.vue";
import LabelManager from "@/game/ui/labels.vue";
import MenuBar from "@/game/ui/menu/menu.vue";
import NoteDialog from "@/game/ui/note.vue";
import SelectionInfo from "@/game/ui/selection/selection_info.vue";
import Tools from "@/game/ui/tools/tools.vue";
import DmSettings from "./ui/dmsettings.vue";

import { createConnection, socket } from "@/game/api/socket";
import { onKeyDown, onKeyUp } from "@/game/events/keyboard";
import { scrollZoom } from "@/game/events/mouse";
import { layerManager } from "@/game/layers/manager";
import { gameStore } from "@/game/store";
import { l2g } from "@/game/units";
import { LocalPoint } from "./geom";
import { dropAsset } from "./layers/utils";
import { coreStore } from "@/core/store";

@Component({
    components: {
        "tool-bar": Tools,
        "selection-info": SelectionInfo,
        "prompt-dialog": Prompt,
        "confirm-dialog": ConfirmDialog,
        "floor-select": FloorSelect,
        "menu-bar": MenuBar,
        "initiative-dialog": Initiative,
        "zoom-slider": vueSlider,
        "note-dialog": NoteDialog,
        "label-dialog": LabelManager,
        "dm-settings": DmSettings,
    },
    beforeRouteEnter(to, from, next) {
        coreStore.setLoading(true);
        createConnection(to);
        next();
    },
    beforeRouteLeave(to, from, next) {
        socket.disconnect();
        next();
    },
})
export default class Game extends Vue {
    $refs!: {
        confirm: InstanceType<typeof ConfirmDialog>;
        note: InstanceType<typeof NoteDialog>;
        prompt: InstanceType<typeof Prompt>;
        tools: InstanceType<typeof Tools>;
    };

    ready = {
        manager: false,
        tools: false,
    };

    throttledmoveSet = false;
    throttledmove: (event: MouseEvent) => void = (_event: MouseEvent) => {};

    throttledtouchmoveSet = false;
    throttledtouchmove: (event: TouchEvent) => void = (_event: TouchEvent) => {};

    get showUI(): boolean {
        return gameStore.showUI;
    }

    get IS_DM(): boolean {
        return gameStore.IS_DM;
    }

    get FAKE_PLAYER(): boolean {
        return gameStore.FAKE_PLAYER;
    }

    get zoomDisplay(): number {
        return gameStore.zoomDisplay;
    }

    set zoomDisplay(value: number) {
        gameStore.updateZoom({
            newZoomDisplay: value,
            zoomLocation: l2g(new LocalPoint(window.innerWidth / 2, window.innerHeight / 2)),
        });
    }

    mounted(): void {
        window.addEventListener("resize", this.resizeWindow);
        window.addEventListener("keyup", onKeyUp);
        window.addEventListener("keydown", onKeyDown);
        this.ready.manager = true;
    }

    destroyed(): void {
        window.removeEventListener("resize", this.resizeWindow);
        window.removeEventListener("keyup", onKeyUp);
        window.removeEventListener("keydown", onKeyDown);
        this.ready.manager = false;
    }

    // Window events

    zoom(event: WheelEvent): void {
        throttle(scrollZoom)(event);
    }

    resizeWindow(): void {
        layerManager.setWidth(window.innerWidth);
        layerManager.setHeight(window.innerHeight);
        layerManager.invalidateAllFloors();
    }

    // Touch events

    touchend(event: TouchEvent): void {
        this.$refs.tools.touchend(event);
    }

    touchstart(event: TouchEvent): void {
        this.$refs.tools.touchstart(event);
    }

    touchmove(event: TouchEvent): void {
        // limit the number of touch moves to ease server load
        if (!this.throttledtouchmoveSet) {
            this.throttledtouchmoveSet = true;
            this.throttledtouchmove = throttle(this.$refs.tools.touchmove, 5);
        }
        // after throttling pass event to object
        this.throttledtouchmove(event);
    }

    // Mouse events

    mousedown(event: MouseEvent): void {
        this.$refs.tools.mousedown(event);
    }

    mouseup(event: MouseEvent): void {
        this.$refs.tools.mouseup(event);
    }

    mousemove(event: MouseEvent): void {
        if (!this.throttledmoveSet) {
            this.throttledmoveSet = true;
            this.throttledmove = throttle(this.$refs.tools.mousemove, 15);
        }
        this.throttledmove(event);
    }

    mouseleave(event: MouseEvent): void {
        this.$refs.tools.mouseleave(event);
    }

    contextmenu(event: MouseEvent): void {
        this.$refs.tools.contextmenu(event);
    }

    async drop(event: DragEvent): Promise<void> {
        if (event === null || event.dataTransfer === null) return;
        if (event.dataTransfer.files.length > 0) {
            await this.$refs.confirm.open("Uploading files should be done through the asset manager.", "Ok", "");
        } else if (event.dataTransfer.getData("text/plain") === "") {
            return;
        } else {
            dropAsset(event);
        }
    }
}
</script>

<style>
a,
a:visited,
a:hover,
a:active {
    color: inherit;
}

svg {
    cursor: pointer;
}

.notAllowed,
.notAllowed > * {
    cursor: not-allowed !important;
}

#layers,
#layers canvas {
    z-index: 0;
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
    overflow: hidden;
}
</style>

<style scoped>
#main {
    display: flex;
    width: 100%;
    height: 100%;
}

#board {
    position: relative;
    width: 100%;
    height: 100%;
}

#zoomer {
    position: absolute;
    top: 15px;
    right: 25px;
    z-index: 11;
}

#FPS {
    position: absolute;
    top: 0;
    right: 75px;
    z-index: 11;
    color: white;
}
</style>

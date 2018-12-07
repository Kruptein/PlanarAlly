<template>
  <div id="main" @mouseleave="mouseleave">
    <menu-bar></menu-bar>
    <div id="board">
      <template v-if="ready.manager">
        <tool-bar ref="tools"></tool-bar>
      </template>
      <div
        id="layers"
        @mousedown="mousedown"
        @mouseup="mouseup"
        @mousemove="mousemove"
        @contextmenu.prevent.stop="contextmenu"
        @dragover.prevent
        @drop="drop"
      ></div>
      <div id="layerselect" v-if="layers.length > 1">
        <ul>
          <li
            v-for="layer in layers"
            :key="layer.name"
            :class="{ 'layer-selected': layer === selectedLayer }"
            @click="selectLayer(layer)"
          >
            <a href="#">{{ layer }}</a>
          </li>
        </ul>
      </div>
    </div>
    <selection-info ref="selectionInfo"></selection-info>
    <initiative-dialog ref="initiative" id="initiativedialog"></initiative-dialog>
    <note-dialog ref="note"></note-dialog>
    <!-- When updating zoom boundaries, also update store updateZoom function;
    should probably do this using a store variable-->
    <zoom-slider
      id="zoomer"
      v-model="zoomFactor"
      :height="6"
      :width="200"
      :min="0.1"
      :max="5.0"
      :interval="0.1"
      :dot-width="8"
      :dot-height="20"
      :tooltip-dir="'bottom'"
      :tooltip="'hover'"
      :formatter="zoomFactor.toFixed(1)"
      :slider-style="{'border-radius': '15%'}"
      :bg-style="{'background-color': '#fff', 'box-shadow': '0.5px 0.5px 3px 1px rgba(0, 0, 0, .36)'}"
      :process-style="{'background-color': '#fff'}"
    ></zoom-slider>
    <prompt-dialog ref="prompt"></prompt-dialog>
    <confirm-dialog ref="confirm"></confirm-dialog>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import vueSlider from "vue-slider-component";

import "@/game/api/events";

import { throttle } from "lodash";
import { mapGetters, mapState } from "vuex";

import ConfirmDialog from "@/core/components/modals/confirm.vue";
import Prompt from "@/core/components/modals/prompt.vue";
import Initiative from "@/game/ui/initiative.vue";
import MenuBar from "@/game/ui/menu/menu.vue";
import NoteDialog from "@/game/ui/note.vue";
import SelectionInfo from "@/game/ui/selection/selection_info.vue";
import Tools from "@/game/ui/tools/tools.vue";

import { createConnection } from "@/game/api/socket";
import { onKeyDown, onKeyUp } from "@/game/events/keyboard";
import { scrollZoom } from "@/game/events/mouse";
import { layerManager } from "@/game/layers/manager";
import { gameStore } from "@/game/store";
import { l2g } from "@/game/units";
import { LocalPoint } from "./geom";

@Component({
    components: {
        "tool-bar": Tools,
        "selection-info": SelectionInfo,
        "prompt-dialog": Prompt,
        "confirm-dialog": ConfirmDialog,
        "menu-bar": MenuBar,
        "initiative-dialog": Initiative,
        "zoom-slider": vueSlider,
        "note-dialog": NoteDialog,
    },
    beforeRouteEnter(to, from, next) {
        createConnection(to);
        next();
    },
})
export default class Game extends Vue {
    $refs!: {
        confirm: InstanceType<typeof ConfirmDialog>;
        tools: InstanceType<typeof Tools>;
    };

    ready = {
        manager: false,
        tools: false,
    };

    get IS_DM(): boolean {
        return gameStore.IS_DM;
    }

    get layers(): string[] {
        return gameStore.layers;
    }

    get selectedLayer(): string {
        return gameStore.selectedLayer;
    }

    get zoomFactor(): number {
        return gameStore.zoomFactor;
    }

    set zoomFactor(value: number) {
        gameStore.updateZoom({
            newZoomValue: value,
            zoomLocation: l2g(new LocalPoint(window.innerWidth / 2, window.innerHeight / 2)),
        });
    }

    mounted() {
        window.addEventListener("resize", () => {
            layerManager.setWidth(window.innerWidth);
            layerManager.setHeight(window.innerHeight);
            layerManager.invalidate();
        });
        window.addEventListener("wheel", throttle(scrollZoom));
        window.addEventListener("keyup", onKeyUp);
        window.addEventListener("keydown", onKeyDown);
        // // prevent double clicking text selection
        window.addEventListener("selectstart", e => {
            e.preventDefault();
            return false;
        });
        this.ready.manager = true;
    }

    mousedown(event: MouseEvent) {
        this.$refs.tools.mousedown(event);
    }
    mouseup(event: MouseEvent) {
        this.$refs.tools.mouseup(event);
    }
    mousemove(event: MouseEvent) {
        this.$refs.tools.mousemove(event);
    }
    mouseleave(event: MouseEvent) {
        this.$refs.tools.mouseleave(event);
    }
    contextmenu(event: MouseEvent) {
        this.$refs.tools.contextmenu(event);
    }
    selectLayer(layer: string) {
        layerManager.selectLayer(layer);
    }
    drop(event: DragEvent) {
        if (event === null || event.dataTransfer === null) return;
        if (event.dataTransfer.files.length > 0) {
            this.$refs.confirm
                .open("Uploading files should be done through the asset manager.", "Ok", "")
                .then(() => {}, () => {});
        } else if (event.dataTransfer.getData("text/plain") === "") {
            return;
        } else {
            layerManager.dropAsset(event);
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

#layerselect {
    position: absolute;
    bottom: 25px;
    left: 25px;
    z-index: 10;
}

#layerselect ul {
    display: flex;
    list-style: none;
    padding: 0;
    margin: 0;
    border: solid 1px #82c8a0;
    border-radius: 6px;
}

#layerselect li {
    display: flex;
    background-color: #eee;
    border-right: solid 1px #82c8a0;
}

#layerselect li:first-child {
    border-radius: 4px 0px 0px 4px; /* Border radius needs to be two less than the actual border, otherwise there will be a gap */
}

#layerselect li:last-child {
    border-right: none;
    border-radius: 0px 4px 4px 0px;
}

#layerselect li:hover {
    background-color: #82c8a0;
}

#layerselect li a {
    -webkit-user-select: none; /* Chrome all / Safari all */
    -moz-user-select: none; /* Firefox all */
    -ms-user-select: none; /* IE 10+ */
    user-select: none;
    display: flex;
    padding: 10px;
    text-decoration: none;
}

#layerselect .layer-selected {
    background-color: #82c8a0;
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

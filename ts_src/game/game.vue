<template>
    <div id="main" @mouseleave="mouseleave">
        <menu-bar></menu-bar>
        <div id="locations-menu" v-if="IS_DM">
            <div></div>
        </div>
        <div id="board">
            <template v-if="ready.manager">
                <tool-bar ref='tools'></tool-bar>
            </template>
            <div id="layers"
                @mousedown="mousedown"
                @mouseup="mouseup"
                @mousemove="mousemove"
                @contextmenu.prevent.stop="contextmenu"
                @dragover.prevent
                @drop='drop'
            ></div>
            <div id="layerselect" v-if="layers.length > 1">
                <ul>
                    <li
                        v-for="layer in layers"
                        :key="layer.name"
                        :class="{ 'layer-selected': layer === selectedLayer }"
                        @click="selectLayer(layer)"
                    ><a href='#'>{{ layer }}</a></li>
                </ul>
            </div>
        </div>
        <selection-info ref='selectionInfo'></selection-info>
        <initiative-dialog ref='initiative' id='initiativedialog'></initiative-dialog>
        <note-dialog ref='note'></note-dialog>
        <!-- When updating zoom boundaries, also update store updateZoom function;
        should probably do this using a store variable -->
        <zoom-slider
            id='zoomer'
            v-model="zoomFactor"
            :height='6'
            :width='200'
            :min='0.1'
            :max='5.0'
            :interval='0.1'
            :dot-width='8'
            :dot-height='20'
            :tooltip-dir="'bottom'"
            :tooltip="'hover'"
            :formatter='zoomFactor.toFixed(1)'
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
import vueSlider from "vue-slider-component";

import { throttle } from "lodash";
import { mapGetters, mapState } from "vuex";

import ConfirmDialog from "../core/components/modals/confirm.vue";
import PromptDialog from "../core/components/modals/prompt.vue";
import gameManager from "./manager";
import InitiativeDialog from "./ui/initiative.vue";
import MenuBar from "./ui/menu/menu.vue";
import NoteDialog from "./ui/note.vue";
import SelectionInfo from "./ui/selection/selection_info.vue";
import Tools from "./ui/tools/tools.vue";

import { onKeyDown, onKeyUp } from "./events/keyboard";
import { scrollZoom } from "./events/mouse";
import { LocalPoint } from "./geom";
import { l2g } from "./units";

const game = Vue.component("Game", {
    components: {
        "tool-bar": Tools,
        "selection-info": SelectionInfo,
        "prompt-dialog": PromptDialog,
        "confirm-dialog": ConfirmDialog,
        "menu-bar": MenuBar,
        "initiative-dialog": InitiativeDialog,
        "zoom-slider": vueSlider,
        "note-dialog": NoteDialog,
    },
    data: () => ({
        ready: {
            manager: false,
            tools: false,
        },
    }),
    computed: {
        ...mapState(["IS_DM", "layers"]),
        ...mapGetters(["selectedLayer"]),
        gridSize() {
            return this.$store.state.game.gridSize;
        },
        zoomFactor: {
            get(): number {
                return this.$store.state.game.zoomFactor;
            },
            set(value: number) {
                this.$store.commit("updateZoom", {
                    newZoomValue: value,
                    zoomLocation: l2g(new LocalPoint(window.innerWidth / 2, window.innerHeight / 2)),
                });
            },
        },
    },
    mounted() {
        window.addEventListener("resize", () => {
            gameManager.layerManager.setWidth(window.innerWidth);
            gameManager.layerManager.setHeight(window.innerHeight);
            gameManager.layerManager.invalidate();
        }),
            window.addEventListener("wheel", throttle(scrollZoom));
        window.addEventListener("keyup", onKeyUp);
        window.addEventListener("keydown", onKeyDown);

        // prevent double clicking text selection
        window.addEventListener("selectstart", e => {
            e.preventDefault();
            return false;
        });

        this.ready.manager = true;
    },
    methods: {
        mousedown(event: MouseEvent) {
            (<any>this.$refs.tools).mousedown(event);
        },
        mouseup(event: MouseEvent) {
            (<any>this.$refs.tools).mouseup(event);
        },
        mousemove(event: MouseEvent) {
            (<any>this.$refs.tools).mousemove(event);
        },
        mouseleave(event: MouseEvent) {
            (<any>this.$refs.tools).mouseleave(event);
        },
        contextmenu(event: MouseEvent) {
            (<any>this.$refs.tools).contextmenu(event);
        },
        selectLayer(layer: string) {
            gameManager.layerManager.selectLayer(layer);
        },
        drop(event: DragEvent) {
            if (event.dataTransfer.files.length > 0) {
                (<any>this.$refs.confirm)
                    .open("Uploading files should be done through the asset manager.", "Ok", "")
                    .then(() => {}, () => {});
            } else if (event.dataTransfer.getData("text/plain") === "") {
                return;
            } else {
                gameManager.layerManager.dropAsset(event);
            }
        },
    },
});

(<any>window).PA = game;
export default game;
</script>

<style>
@import url("https://maxcdn.bootstrapcdn.com/font-awesome/4.6.1/css/font-awesome.min.css");
@import url("https://fonts.googleapis.com/css?family=Open+Sans");
html,
body,
#main {
    height: 100%;
    font-family: "Open Sans", sans-serif;
    font-weight: 200;
}

body {
    margin: 0;
}

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

#main {
    display: flex;
}

#board {
    position: relative;
    width: 100%;
    height: 100%;
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

.draggable {
    list-style: none;
    font-family: helvetica;
}

.accordion {
    background-color: #eee;
    color: #444;
    cursor: pointer;
    padding: 18px;
    text-align: left;
    border: none;
    outline: none;
    transition: 0.4s;
    border-top: solid 1px #82c8a0;
    width: 100%;
    width: -moz-available;
    width: -webkit-fill-available;
    width: fill-available;
}

.accordion-active,
.accordion:hover {
    background-color: #82c8a0;
}

.accordion-panel {
    background-color: white;
    display: none;
    overflow: hidden;
    min-height: 2em;
}

.accordion-subpanel {
    display: flex;
    flex-direction: column;
    width: 100%;
}

.accordion-subpanel > * {
    padding: 5px;
    display: flex;
    justify-content: space-evenly;
    align-items: center;
}

.accordion-subpanel > *:hover {
    background-color: #82c8a0;
}

.token {
    padding: 5px 10px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
}

.token img {
    margin-right: 5px;
}

.token svg {
    margin-left: auto;
}

#exitButton {
    position: fixed;
    bottom: 0px;
    width: 100%;
}

#zoomer {
    position: absolute;
    top: 15px;
    right: 25px;
    z-index: 11;
}

.switch {
    position: relative;
    display: inline-block;
    width: 40px;
    height: 20px;
}

.switch input {
    display: none;
}

.slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    -webkit-transition: 0.4s;
    transition: 0.4s;
}

.slider:before {
    position: absolute;
    content: "";
    height: 14px;
    width: 14px;
    left: 4px;
    bottom: 3px;
    background-color: white;
    -webkit-transition: 0.4s;
    transition: 0.4s;
}

input:checked + .slider {
    background-color: #2196f3;
}

input:focus + .slider {
    box-shadow: 0 0 1px #2196f3;
}

input:checked + .slider:before {
    -webkit-transform: translateX(18px);
    -ms-transform: translateX(18px);
    transform: translateX(18px);
}

.slider.round {
    border-radius: 34px;
}

.slider.round:before {
    border-radius: 50%;
}

#radialmenu {
    position: absolute;
    z-index: 20;
    width: 0;
    height: 0;
    pointer-events: auto;
}

/* The svg is added by Font Awesome */

.rm-list-dm #rm-locations svg {
    margin-left: 50px;
}

.rm-list-dm #rm-settings svg {
    margin-bottom: 50px;
}

/* https://codepen.io/jonigiuro/pen/kclIu/ */

.rm-wrapper {
    position: relative;
    width: 200px;
    height: 200px;
    top: -100px;
    left: -100px;
}

.rm-wrapper .rm-topper {
    pointer-events: none;
    text-align: center;
    line-height: 50px;
    font-size: 25px;
}

.rm-wrapper .rm-toggler,
.rm-wrapper .rm-topper {
    display: block;
    position: absolute;
    width: 50px;
    height: 50px;
    left: 50%;
    top: 50%;
    margin-left: -25px;
    margin-top: -25px;
    background: #fa5a5a;
    color: white;
    border-radius: 50%;
}

.rm-wrapper .rm-toggler .rm-list,
.rm-wrapper .rm-topper .rm-list {
    opacity: 0.5;
    list-style: none;
    padding: 0;
    width: 200px;
    height: 200px;
    overflow: hidden;
    display: block;
    border-radius: 50%;
    transform: rotate(180deg);
    box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.2);
    margin: -75px 0 0 -75px;
}

.rm-list-dm {
    transform: rotate(135deg) !important; /* total deg: 135 */
}

.rm-wrapper .rm-toggler:hover .rm-list,
.rm-wrapper .rm-topper:hover .rm-list {
    opacity: 1;
}

.rm-wrapper .rm-toggler .rm-list .rm-item,
.rm-wrapper .rm-topper .rm-list .rm-item {
    display: table;
    width: 50%;
    height: 50%;
    float: left;
    text-align: center;
    box-shadow: inset 0 0 2px 0 rgba(0, 0, 0, 0.2);
    background-color: white;
}

.rm-wrapper .rm-toggler .rm-list .rm-item:hover,
.rm-wrapper .rm-topper .rm-list .rm-item:hover {
    background-color: #82c8a0;
}

.rm-wrapper .rm-toggler .rm-list .rm-item:hover a,
.rm-wrapper .rm-topper .rm-list .rm-item:hover a {
    color: white;
}

.rm-wrapper .rm-toggler .rm-list .rm-item a,
.rm-wrapper .rm-topper .rm-list .rm-item a {
    display: table-cell;
    vertical-align: middle;
    transform: rotate(-45deg);
    text-decoration: none;
    font-size: 25px;
    color: #82c8a0;
    border: none;
    outline: none;
}

.notedialog {
    align-items: center;
    display: grid;
}

#shapeselectiondialog > div {
    display: grid;
    grid-template-columns: [name] 1fr [numerator] 30px [slash] 5px [denominator] 30px [colour] 40px [visible] 30px [light] 30px [remove] 30px [end];
    grid-column-gap: 5px;
    align-items: center;
}

#renameNote {
    width: 90%;
}

.spanrow {
    grid-column: 1 / end;
}

#shapeselectiondialog .sp-dd {
    display: none;
}

select {
    font-family: FontAwesome, sans-serif;
}

/*
DIRECTORY.CSS changes

* Collapse all folders by default, use js to toggle visibility on click.
* On hover over folder show some visual feedback
* On hover over file show the image

*/
.folder > * {
    display: none;
}

.directory > .folder,
.directory > .file {
    display: block;
}

.folder:hover {
    font-weight: bold;
    cursor: pointer;
}

.folder:hover > * {
    font-weight: normal;
}
</style>

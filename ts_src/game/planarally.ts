import Vue from "vue";
import { throttle } from 'lodash';

import store from "./store";

import Tools from "./ui/tools/tools.vue";
import SelectionInfo from "./ui/selection_info.vue";
import PromptDialog from "../core/components/modals/prompt.vue";
import MenuBar from "./ui/menu.vue";

import { GameManager } from './manager';
import { onKeyDown, onKeyUp } from './events/keyboard';
import { scrollZoom } from './events/mouse';
import { mapState, mapGetters } from "vuex";

const gameManager = new GameManager();

export const vm = new Vue({
    el: '#main',
    store,
    delimiters: ['[[', ']]'],
    components: {
        'tool-bar': Tools,
        'selection-info': SelectionInfo,
        'prompt-dialog': PromptDialog,
        'menu-bar': MenuBar,
    },
    data: {
        ready: {
            manager: false,
            tools: false
        },
    },
    computed: {
        ...mapState([
            'IS_DM',
            'layers'
        ]),
        ...mapGetters([
            'selectedLayer'
        ])
    },
    mounted() {
        window.addEventListener("resize", () => {
            gameManager.layerManager.setWidth(window.innerWidth);
            gameManager.layerManager.setHeight(window.innerHeight);
            gameManager.layerManager.invalidate();
        }),
        window.addEventListener('wheel', throttle(scrollZoom));
        window.addEventListener("keyup", onKeyUp);
        window.addEventListener("keydown", onKeyDown);

        // prevent double clicking text selection
        window.addEventListener('selectstart', function (e) {
            e.preventDefault();
            return false;
        });

        this.ready.manager = true;
    },
    methods: {
        mousedown(event: MouseEvent) { (<any>this.$refs.tools).mousedown(event); },
        mouseup(event: MouseEvent) { (<any>this.$refs.tools).mouseup(event); },
        mousemove(event: MouseEvent) { (<any>this.$refs.tools).mousemove(event); },
        contextmenu(event: MouseEvent) { (<any>this.$refs.tools).contextmenu(event); },
        selectLayer(layer: string) {
            gameManager.layerManager.setLayer(layer);
        }
    }
});

(<any>window).vm = vm;
(<any>window).gameManager = gameManager;

export default gameManager;

// **** SETUP UI ****

// $("#zoomer").slider({
//     orientation: "vertical",
//     min: 0.1,
//     max: 5.0,
//     step: 0.1,
//     value: Settings.zoomFactor,
//     slide: function (event, ui) {
//         Settings.updateZoom(ui.value!, l2g(new LocalPoint(window.innerWidth / 2, window.innerHeight / 2)));
//     }
// });

// const settings_menu = $("#menu")!;
// const locations_menu = $("#locations-menu")!;
// const layer_menu = $("#layerselect")!;

// $('#rm-settings').on("click", function () {
//     // order of animation is important, it otherwise will sometimes show a small gap between the two objects
//     if (settings_menu.is(":visible")) {
//         $('#radialmenu').animate({ left: "-=200px" });
//         settings_menu.animate({ width: 'toggle' });
//         locations_menu.animate({ left: "-=200px", width: "+=200px" });
//         layer_menu.animate({ left: "-=200px" });
//     } else {
//         settings_menu.animate({ width: 'toggle' });
//         $('#radialmenu').animate({ left: "+=200px" });
//         locations_menu.animate({ left: "+=200px", width: "-=200px" });
//         layer_menu.animate({ left: "+=200px" });
//     }
// });

// $('#rm-locations').on("click", function () {
//     // order of animation is important, it otherwise will sometimes show a small gap between the two objects
//     if (locations_menu.is(":visible")) {
//         $('#radialmenu').animate({ top: "-=100px" });
//         locations_menu.animate({ height: 'toggle' });
//     } else {
//         locations_menu.animate({ height: 'toggle' });
//         $('#radialmenu').animate({ top: "+=100px" });
//     }
// });

// $("#createNote").on("click", function () {
//     gameManager.newNote("New note", "...", true, true);
// });

// $("#gridSizeInput").on("change", function (e) {
//     const gs = parseInt((<HTMLInputElement>e.target).value);
//     Settings.setGridSize(gs, true);
// });

// $("#unitSizeInput").on("change", function (e) {
//     const us = parseInt((<HTMLInputElement>e.target).value);
//     Settings.setUnitSize(us, true);
// });
// $("#useGridInput").on("change", function (e) {
//     const ug = (<HTMLInputElement>e.target).checked;
//     Settings.setUseGrid(ug, true);
// });
// $("#useFOWInput").on("change", function (e) {
//     const uf = (<HTMLInputElement>e.target).checked;
//     Settings.setFullFOW(uf, true);
// });
// $("#fowLOS").on("change", function (e) {
//     const los = (<HTMLInputElement>e.target).checked;
//     Settings.setLineOfSight(los, true);
// });
// $("#fowOpacity").on("change", function (e) {
//     let fo = parseFloat((<HTMLInputElement>e.target).value);
//     if (isNaN(fo)) {
//         $("#fowOpacity").val(Settings.fowOpacity);
//         return;
//     }
//     if (fo < 0) fo = 0;
//     if (fo > 1) fo = 1;
//     Settings.setFOWOpacity(fo, true);
// });
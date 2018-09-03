import Vue from "vue";
import { throttle } from 'lodash';

import store from "./store";

import Tools from "./ui/tools/tools.vue";
import SelectionInfo from "./ui/selection/selection_info.vue";
import PromptDialog from "../core/components/modals/prompt.vue";
import MenuBar from "./ui/menu/menu.vue";
import InitiativeDialog from "./ui/initiative.vue";

import { GameManager } from './manager';
import { onKeyDown, onKeyUp } from './events/keyboard';
import { scrollZoom } from './events/mouse';
import { mapState, mapGetters } from "vuex";
import vueSlider from 'vue-slider-component'
import { l2g } from "./units";
import { LocalPoint } from "./geom";

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
        'initiative-dialog': InitiativeDialog,
        'zoom-slider': vueSlider,
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
        ]),
        zoomFactor: {
            get(): number {
                return this.$store.state.zoomFactor;
            },
            set(value: number) {
                this.$store.commit("updateZoom", {newZoomValue: value, zoomLocation: l2g(new LocalPoint(window.innerWidth / 2, window.innerHeight / 2))})
            }
        }
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

// $("#createNote").on("click", function () {
//     gameManager.newNote("New note", "...", true, true);
// });
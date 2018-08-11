import Vue from 'vue';
import SelectTool from "./select.vue";
import PanTool from "./pan.vue";
import RulerTool from "./ruler.vue";
import MapTool from "./map.vue";
import shape_menu from "../shapes/shapecontext.vue";
import createtoken_modal from "./createtoken_modal.vue";

import Settings from '../settings';
import gameManager from '../planarally';
import { getMouse } from '../utils';
import { l2g } from '../units';


export const app = new Vue({
    el: '#main',
    delimiters: ['[[', ']]'],
    components: {
        'select-tool': SelectTool,
        'pan-tool': PanTool,
        'ruler-tool': RulerTool,
        'map-tool': MapTool,
        'shape-menu': shape_menu,
        'createtoken-dialog': createtoken_modal
    },
    data: {
        toolsLoaded: false,
        currentTool: "select",
        tools: ["select", "pan", "ruler", "map"]
    },
    watch: {
        currentTool(newValue, oldValue) {
            this.$emit("tools-select-change", newValue, oldValue);
        }
    },
    methods: {
        ready() {
            return Settings !== undefined;
        },
        mousedown(event: MouseEvent) {
            if (!Settings.board_initialised) return;
            if ((<HTMLElement>event.target).tagName !== 'CANVAS') return;
            
            let targetTool = this.currentTool;
            if (event.button == 1) {
                targetTool = "pan";
            } else if (event.button !== 0) {
                return;
            }

            this.$emit('mousedown', event, targetTool);
        },
        mouseup(event: MouseEvent) {
            if (!Settings.board_initialised) return;
            if ((<HTMLElement>event.target).tagName !== 'CANVAS') return;

            let targetTool = this.currentTool;
            if (event.button == 1) {
                targetTool = "pan";
            } else if (event.button !== 0) {
                return;
            }

            this.$emit('mouseup', event, targetTool);
        },
        mousemove(event: MouseEvent) {
            if (!Settings.board_initialised) return;
            if ((<HTMLElement>event.target).tagName !== 'CANVAS') return;
            
            let targetTool = this.currentTool;
            if ((event.buttons & 4) !== 0) {
                targetTool = "pan";
            } else if ((event.button & 1) > 1) {
                return;
            }
            
            this.$emit('mousemove', event, targetTool);

            // Annotation hover
            let found = false;
            for (let i = 0; i < gameManager.annotations.length; i++) {
                const uuid = gameManager.annotations[i];
                if (gameManager.layerManager.UUIDMap.has(uuid) && gameManager.layerManager.hasLayer("draw")) {
                    const shape = gameManager.layerManager.UUIDMap.get(uuid)!;
                    if (shape.contains(l2g(getMouse(event)))) {
                        found = true;
                        gameManager.annotationManager.setActiveText(shape.annotation);
                    }
                }
            }
            if (!found && gameManager.annotationManager.shown) {
                gameManager.annotationManager.setActiveText('');
            }
        },
        contextmenu(event: MouseEvent) {
            if (!Settings.board_initialised) return;
            if ((<HTMLElement>event.target).tagName !== 'CANVAS') return;
            if (event.button !== 2 || (<HTMLElement>event.target).tagName !== 'CANVAS') return;
            this.$emit("contextmenu", event, this.currentTool);
        }
    },
    computed: {
        currentTabComponent(): string {
            return `${this.currentTool.toLowerCase()}-tool`;
        }
    }
});

export function setupTools(): void {
    app.toolsLoaded = true;
}
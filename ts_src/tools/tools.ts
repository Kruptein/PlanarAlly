import Vue from 'vue';
import SelectTool from "./select.vue";
import PanTool from "./pan.vue";
import shapecontext from "../shapes/shapecontext.vue";

import Settings from '../settings';
import gameManager from '../planarally';
import { getMouse } from '../utils';
import { l2g } from '../units';


const app = new Vue({
    el: '#main',
    delimiters: ['[[', ']]'],
    components: {
        'select-tool': SelectTool,
        'pan-tool': PanTool,
        shapecontext
    },
    data: {
        toolsLoaded: false,
        currentTool: "select",
        tools: ["select", "pan"]
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
    // console.log("setup");
    // app.$emit("loadTools");
    // const toolselectDiv = $("#toolselect").find("ul");
    // tools.forEach(function (tool) {
    //     if (!tool.playerTool && !Settings.IS_DM) return;

    //     const toolInstance = new tool.clz();
    //     gameManager.tools.set(tool.name, toolInstance);
    //     const extra = tool.defaultSelect ? " class='tool-selected'" : "";
    //     const toolLi = $("<li id='tool-" + tool.name + "'" + extra + "><a href='#'>" + capitalize(tool.name) + "</a></li>");
    //     toolselectDiv.append(toolLi);
    //     if (tool.hasDetail && toolInstance.detailDiv !== undefined) {
    //         const div = toolInstance.detailDiv;
    //         $('#tooldetail').append(div);
    //         div.hide();
    //     }
    //     toolLi.on("click", function () {
    //         const index = tools.indexOf(tool);
    //         if (index !== gameManager.selectedTool) {
    //             gameManager.tools.getIndexValue(gameManager.selectedTool).onDeselect();
    //             $('.tool-selected').removeClass("tool-selected");
    //             $(this).addClass("tool-selected");
    //             gameManager.selectedTool = index;
    //             const detail = $('#tooldetail');
    //             if (tool.hasDetail) {
    //                 $('#tooldetail').children().hide();
    //                 toolInstance.detailDiv!.show();
    //                 detail.show();
    //             } else {
    //                 detail.hide();
    //             }
    //             gameManager.tools.getIndexValue(gameManager.selectedTool).onSelect();
    //         }
    //     });
    // });
}

// const tools = [
//     { name: "select", playerTool: true, defaultSelect: true, hasDetail: false, clz: SelectTool },
//     { name: "pan", playerTool: true, defaultSelect: false, hasDetail: false, clz: PanTool },
//     { name: "draw", playerTool: true, defaultSelect: false, hasDetail: true, clz: DrawTool },
//     { name: "ruler", playerTool: true, defaultSelect: false, hasDetail: false, clz: RulerTool },
//     { name: "fow", playerTool: false, defaultSelect: false, hasDetail: true, clz: FOWTool },
//     { name: "brush", playerTool: false, defaultSelect: false, hasDetail: true, clz: BrushTool },
//     { name: "map", playerTool: false, defaultSelect: false, hasDetail: true, clz: MapTool },
// ];

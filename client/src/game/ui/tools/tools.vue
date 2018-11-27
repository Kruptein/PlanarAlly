<template>
    <div>
        <div id='toolselect'>
            <ul>
                <li
                    v-for="tool in tools"
                    v-if="!dmTools.includes(tool) || IS_DM"
                    :key="tool"
                    :class="{'tool-selected': currentTool === tool}"
                    :ref="tool + '-selector'"
                    @click="currentTool = tool"
                ><a href='#'>{{ tool }}</a></li>
            </ul>
        </div>
        <div>
            <template>
                <select-tool v-show="currentTool === 'Select'" ref='selectTool'></select-tool>
                <pan-tool v-show="currentTool === 'Pan'"></pan-tool>
                <keep-alive><draw-tool v-show="currentTool === 'Draw'"></draw-tool></keep-alive>
                <ruler-tool v-show="currentTool === 'Ruler'"></ruler-tool>
                <map-tool v-show="currentTool === 'Map'"></map-tool>
                <shape-menu ref="shapecontext"></shape-menu>
                <createtoken-dialog ref="createtokendialog"></createtoken-dialog>
            </template>
        </div>
    </div>
</template>


<script lang="ts">
import Vue from "vue";

import layerManager from "@/game/layers/manager";
import gameManager from "@/game/manager";
import store from "@/game/store";
import shape_menu from "@/game/ui/selection/shapecontext.vue";
import createtoken_modal from "@/game/ui/tools/createtoken_modal.vue";
import DrawTool from "@/game/ui/tools/draw.vue";
import MapTool from "@/game/ui/tools/map.vue";
import PanTool from "@/game/ui/tools/pan.vue";
import RulerTool from "@/game/ui/tools/ruler.vue";
import SelectTool from "@/game/ui/tools/select.vue";

import { l2g } from "@/game/units";
import { getMouse } from "@/game/utils";

export default Vue.component("tools", {
    components: {
        "select-tool": SelectTool,
        "pan-tool": PanTool,
        "draw-tool": DrawTool,
        "ruler-tool": RulerTool,
        "map-tool": MapTool,
        "shape-menu": shape_menu,
        "createtoken-dialog": createtoken_modal,
    },
    data: () => ({
        currentTool: "Select",
        tools: ["Select", "Pan", "Draw", "Ruler", "Map"],
        dmTools: ["Map"],
    }),
    watch: {
        currentTool(newValue, oldValue) {
            this.$emit("tools-select-change", newValue, oldValue);
        },
    },
    computed: {
        IS_DM(): boolean {
            return this.$store.state.game.IS_DM;
        },
        currentToolComponent(): string {
            return `${this.currentTool.toLowerCase()}-tool`;
        },
    },
    methods: {
        mousedown(event: MouseEvent) {
            if ((<HTMLElement>event.target).tagName !== "CANVAS") return;

            let targetTool = this.currentTool;
            if (event.button === 1) {
                targetTool = "Pan";
            } else if (event.button !== 0) {
                return;
            }

            this.$emit("mousedown", event, targetTool);
        },
        mouseup(event: MouseEvent) {
            if ((<HTMLElement>event.target).tagName !== "CANVAS") return;

            let targetTool = this.currentTool;
            if (event.button === 1) {
                targetTool = "Pan";
            } else if (event.button !== 0) {
                return;
            }

            this.$emit("mouseup", event, targetTool);
        },
        mousemove(event: MouseEvent) {
            if ((<HTMLElement>event.target).tagName !== "CANVAS") return;

            let targetTool = this.currentTool;
            if ((event.buttons & 4) !== 0) {
                targetTool = "Pan";
            } else if ((event.button & 1) > 1) {
                return;
            }

            this.$emit("mousemove", event, targetTool);

            // Annotation hover
            let found = false;
            for (const uuid of store.annotations) {
                if (layerManager.UUIDMap.has(uuid) && layerManager.hasLayer("draw")) {
                    const shape = layerManager.UUIDMap.get(uuid)!;
                    if (shape.contains(l2g(getMouse(event)))) {
                        found = true;
                        gameManager.annotationManager.setActiveText(shape.annotation);
                    }
                }
            }
            if (!found && gameManager.annotationManager.shown) {
                gameManager.annotationManager.setActiveText("");
            }
        },
        mouseleave(event: MouseEvent) {
            // When leaving the window while a mouse is pressed down, act as if it was released
            if ((event.buttons & 1) !== 0) {
                this.$emit("mouseup", event, this.currentTool);
            }
        },
        contextmenu(event: MouseEvent) {
            if ((<HTMLElement>event.target).tagName !== "CANVAS") return;
            if (event.button !== 2 || (<HTMLElement>event.target).tagName !== "CANVAS") return;
            this.$emit("contextmenu", event, this.currentTool);
        },
    },
});
</script>


<style scoped>
#toolselect {
    position: absolute;
    bottom: 25px;
    right: 25px;
    z-index: 10;
}

#toolselect > ul {
    display: flex;
    list-style: none;
    padding: 0;
    margin: 0;
    border: solid 1px #82c8a0;
    border-radius: 7px;
}

#toolselect > ul > li {
    display: flex;
    background-color: #eee;
    border-right: solid 1px #82c8a0;
}

#toolselect > ul > li:last-child {
    border-right: none;
    border-radius: 0px 4px 4px 0px; /* Border radius needs to be two less than the actual border, otherwise there will be a gap */
}

#toolselect > ul > li:first-child {
    border-radius: 4px 0px 0px 4px;
}

#toolselect > ul > li:hover {
    background-color: #82c8a0;
}

#toolselect > ul > li a {
    -webkit-user-select: none; /* Chrome all / Safari all */
    -moz-user-select: none; /* Firefox all */
    -ms-user-select: none; /* IE 10+ */
    user-select: none;
    display: flex;
    padding: 10px;
    text-decoration: none;
}

#toolselect .tool-selected {
    background-color: #82c8a0;
}
</style>

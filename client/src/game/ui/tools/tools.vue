<template>
    <div>
        <div id="toolselect">
            <ul>
                <li
                    v-for="tool in visibleTools"
                    :key="tool"
                    :class="{ 'tool-selected': currentTool === tool }"
                    :ref="tool + '-selector'"
                    v-show="toolVisible(tool)"
                    @mousedown="currentTool = tool"
                >
                    <a href="#">{{ tool }}</a>
                </li>
            </ul>
        </div>
        <div>
            <template>
                <select-tool v-show="currentTool === 'Select'" ref="selectTool"></select-tool>
                <pan-tool v-show="currentTool === 'Pan'"></pan-tool>
                <keep-alive>
                    <draw-tool v-show="currentTool === 'Draw'"></draw-tool>
                </keep-alive>
                <ruler-tool v-show="currentTool === 'Ruler'"></ruler-tool>
                <ping-tool v-show="currentTool === 'Ping'"></ping-tool>
                <map-tool v-show="currentTool === 'Map'"></map-tool>
                <filter-tool v-show="currentTool === 'Filter'"></filter-tool>
                <vision-tool v-show="currentTool === 'Vision'"></vision-tool>
                <shape-menu ref="shapecontext"></shape-menu>
                <default-menu ref="defaultcontext"></default-menu>
                <createtoken-dialog ref="createtokendialog"></createtoken-dialog>
            </template>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";

import ShapeContext from "@/game/ui/selection/shapecontext.vue";
import CreateTokenModal from "@/game/ui/tools/createtoken_modal.vue";
import DefaultContext from "@/game/ui/tools/defaultcontext.vue";
import DrawTool from "@/game/ui/tools/draw.vue";
import FilterTool from "@/game/ui/tools/filter.vue";
import MapTool from "@/game/ui/tools/map.vue";
import PanTool from "@/game/ui/tools/pan";
import SelectTool from "@/game/ui/tools/select.vue";
import VisionTool from "@/game/ui/tools/vision.vue";

import { layerManager } from "@/game/layers/manager";
import { gameManager } from "@/game/manager";
import { gameStore } from "@/game/store";
import { PingTool } from "@/game/ui/tools/ping";
import { RulerTool } from "@/game/ui/tools/ruler";
import { l2g } from "@/game/units";
import { getLocalPointFromEvent } from "@/game/utils";
import Component from "vue-class-component";

@Component({
    components: {
        "select-tool": SelectTool,
        "pan-tool": PanTool,
        "draw-tool": DrawTool,
        "ruler-tool": RulerTool,
        "ping-tool": PingTool,
        "map-tool": MapTool,
        "filter-tool": FilterTool,
        "vision-tool": VisionTool,
        "shape-menu": ShapeContext,
        "default-menu": DefaultContext,
        "createtoken-dialog": CreateTokenModal,
    },
    watch: {
        currentTool(newValue, oldValue) {
            this.$emit("tools-select-change", newValue, oldValue);
        },
    },
})
export default class Tools extends Vue {
    $refs!: {
        selectTool: InstanceType<typeof SelectTool>;
    };

    currentTool = "Select";
    tools = ["Select", "Pan", "Draw", "Ruler", "Ping", "Map", "Filter", "Vision"];
    dmTools = ["Map"];

    get IS_DM(): boolean {
        return gameStore.IS_DM;
    }

    get currentToolComponent(): string {
        return `${this.currentTool.toLowerCase()}-tool`;
    }

    get visibleTools(): string[] {
        return this.tools.filter(t => !this.dmTools.includes(t) || this.IS_DM);
    }

    toolVisible(tool: string): boolean {
        if (tool === "Filter") {
            return Object.keys(gameStore.labels).length > 0;
        } else if (tool === "Vision") {
            return gameStore.ownedtokens.length > 1;
        }
        return true;
    }

    mousedown(event: MouseEvent): void {
        if ((<HTMLElement>event.target).tagName !== "CANVAS") return;

        let targetTool = this.currentTool;
        if (event.button === 1) {
            targetTool = "Pan";
        } else if (event.button !== 0) {
            return;
        }

        this.$emit("mousedown", event, targetTool);
    }
    mouseup(event: MouseEvent): void {
        if ((<HTMLElement>event.target).tagName !== "CANVAS") return;

        let targetTool = this.currentTool;
        if (event.button === 1) {
            targetTool = "Pan";
        } else if (event.button !== 0) {
            return;
        }

        this.$emit("mouseup", event, targetTool);
    }
    mousemove(event: MouseEvent): void {
        if ((<HTMLElement>event.target).tagName !== "CANVAS") return;

        let targetTool = this.currentTool;
        // force targetTool to pan if hitting mouse wheel
        if ((event.buttons & 4) !== 0) {
            targetTool = "Pan";
        } else if ((event.button & 1) > 1) {
            return;
        }

        this.$emit("mousemove", event, targetTool);

        // Annotation hover
        let found = false;
        for (const uuid of gameStore.annotations) {
            if (layerManager.UUIDMap.has(uuid) && layerManager.hasLayer(layerManager.floor!.name, "draw")) {
                const shape = layerManager.UUIDMap.get(uuid)!;
                if (shape.contains(l2g(getLocalPointFromEvent(event)))) {
                    found = true;
                    gameManager.annotationManager.setActiveText(shape.annotation);
                }
            }
        }
        if (!found && gameManager.annotationManager.shown) {
            gameManager.annotationManager.setActiveText("");
        }
    }
    mouseleave(event: MouseEvent): void {
        // When leaving the window while a mouse is pressed down, act as if it was released
        if ((event.buttons & 1) !== 0) {
            this.$emit("mouseup", event, this.currentTool);
        }
    }
    contextmenu(event: MouseEvent): void {
        if ((<HTMLElement>event.target).tagName !== "CANVAS") return;
        if (event.button !== 2 || (<HTMLElement>event.target).tagName !== "CANVAS") return;
        this.$emit("contextmenu", event, this.currentTool);
    }

    touchstart(event: TouchEvent): void {
        if ((<HTMLElement>event.target).tagName !== "CANVAS") return;

        const targetTool = this.currentTool;

        this.$emit("touchstart", event, targetTool);
    }

    touchend(event: TouchEvent): void {
        if ((<HTMLElement>event.target).tagName !== "CANVAS") return;

        const targetTool = this.currentTool;

        this.$emit("touchend", event, targetTool);
    }

    touchmove(event: TouchEvent): void {
        if ((<HTMLElement>event.target).tagName !== "CANVAS") return;

        const targetTool = this.currentTool;

        this.$emit("touchmove", event, targetTool);

        // Annotation hover
        let found = false;
        for (const uuid of gameStore.annotations) {
            if (layerManager.UUIDMap.has(uuid) && layerManager.hasLayer(layerManager.floor!.name, "draw")) {
                const shape = layerManager.UUIDMap.get(uuid)!;
                if (shape.contains(l2g(getLocalPointFromEvent(event)))) {
                    found = true;
                    gameManager.annotationManager.setActiveText(shape.annotation);
                }
            }
        }
        if (!found && gameManager.annotationManager.shown) {
            gameManager.annotationManager.setActiveText("");
        }
    }
}
</script>

<style scoped>
#toolselect {
    position: absolute;
    bottom: 25px;
    right: 25px;
    z-index: 10;
}

#toolselect * {
    user-select: none !important;
    -webkit-user-drag: none !important;
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
    display: flex;
    padding: 10px;
    text-decoration: none;
}

#toolselect .tool-selected {
    background-color: #82c8a0;
}
</style>

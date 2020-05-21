<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import ShapeContext from "@/game/ui/selection/shapecontext.vue";
import CreateTokenModal from "@/game/ui/tools/createtoken_modal.vue";
import DefaultContext from "@/game/ui/tools/defaultcontext.vue";
import DrawTool from "@/game/ui/tools/draw.vue";
import FilterTool from "@/game/ui/tools/filter.vue";
import MapTool from "@/game/ui/tools/map.vue";
import PanTool from "@/game/ui/tools/pan";
import SelectTool, { SelectFeatures } from "@/game/ui/tools/select.vue";
import Tool from "./tool.vue";
import VisionTool from "@/game/ui/tools/vision.vue";

import { layerManager } from "@/game/layers/manager";
import { gameManager } from "@/game/manager";
import { gameStore } from "@/game/store";
import { PingTool } from "@/game/ui/tools/ping";
import { RulerTool } from "@/game/ui/tools/ruler";
import { l2g } from "@/game/units";
import { getLocalPointFromEvent } from "@/game/utils";
import { ToolName } from "./utils";

@Component({
    components: {
        SelectTool,
        PanTool,
        DrawTool,
        RulerTool,
        PingTool,
        MapTool,
        FilterTool,
        VisionTool,
        ShapeContext,
        DefaultContext,
        CreateTokenModal,
    },
    watch: {
        currentTool(newValue: ToolName, oldValue: ToolName) {
            const old = (<Tools>this).componentMap[oldValue];
            old.selected = false;
            old.onDeselect();
            const new_ = (<Tools>this).componentMap[newValue];
            new_.selected = true;
            new_.onSelect();
        },
    },
})
export default class Tools extends Vue {
    $refs!: {
        selectTool: InstanceType<typeof SelectTool>;
        panTool: InstanceType<typeof PanTool>;
        drawTool: InstanceType<typeof PanTool>;
        rulerTool: InstanceType<typeof PanTool>;
        pingTool: InstanceType<typeof PanTool>;
        mapTool: InstanceType<typeof PanTool>;
        filterTool: InstanceType<typeof PanTool>;
        visionTool: InstanceType<typeof PanTool>;
    };

    private componentmap_: { [key in ToolName]: InstanceType<typeof Tool> } = <any>{};

    mounted(): void {
        this.componentmap_ = {
            [ToolName.Select]: this.$refs.selectTool,
            [ToolName.Pan]: this.$refs.panTool,
            [ToolName.Draw]: this.$refs.drawTool,
            [ToolName.Ruler]: this.$refs.rulerTool,
            [ToolName.Ping]: this.$refs.pingTool,
            [ToolName.Map]: this.$refs.mapTool,
            [ToolName.Filter]: this.$refs.filterTool,
            [ToolName.Vision]: this.$refs.visionTool,
        };
    }

    currentTool = ToolName.Select;
    tools = Object.values(ToolName);
    dmTools = [ToolName.Map];

    buildTools = [
        ToolName.Select,
        ToolName.Pan,
        ToolName.Draw,
        ToolName.Ruler,
        ToolName.Map,
        ToolName.Filter,
        ToolName.Vision,
    ];
    playTools: [ToolName, number[]][] = [[ToolName.Select, [SelectFeatures.Resize]]];
    mode: "Build" | "Play" = "Build";

    get componentMap(): { [key in ToolName]: InstanceType<typeof Tool> } {
        return this.componentmap_;
    }

    get IS_DM(): boolean {
        return gameStore.IS_DM;
    }

    getCurrentToolComponent(): Tool {
        return this.componentMap[this.currentTool];
    }

    get visibleTools(): string[] {
        return this.tools.filter(t => (!this.dmTools.includes(t) || this.IS_DM) && this.toolVisible(t));
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
            targetTool = ToolName.Pan;
        } else if (event.button !== 0) {
            return;
        }

        const tool = this.componentMap[targetTool];
        tool.onMouseDown(event, {});
        for (const permitted of tool.permittedTools)
            this.componentMap[permitted.name].onMouseDown(event, permitted.features);
    }
    mouseup(event: MouseEvent): void {
        if ((<HTMLElement>event.target).tagName !== "CANVAS") return;

        let targetTool = this.currentTool;
        if (event.button === 1) {
            targetTool = ToolName.Pan;
        } else if (event.button !== 0) {
            return;
        }

        const tool = this.componentMap[targetTool];
        tool.onMouseUp(event, {});
        for (const permitted of tool.permittedTools)
            this.componentMap[permitted.name].onMouseUp(event, permitted.features);
    }
    mousemove(event: MouseEvent): void {
        if ((<HTMLElement>event.target).tagName !== "CANVAS") return;

        let targetTool = this.currentTool;
        // force targetTool to pan if hitting mouse wheel
        if ((event.buttons & 4) !== 0) {
            targetTool = ToolName.Pan;
        } else if ((event.button & 1) > 1) {
            return;
        }

        const tool = this.componentMap[targetTool];
        tool.onMouseMove(event, {});
        for (const permitted of tool.permittedTools)
            this.componentMap[permitted.name].onMouseMove(event, permitted.features);

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
            const tool = this.componentMap[this.currentTool];
            tool.onMouseUp(event, {});
            for (const permitted of tool.permittedTools)
                this.componentMap[permitted.name].onMouseUp(event, permitted.features);
        }
    }
    contextmenu(event: MouseEvent): void {
        if ((<HTMLElement>event.target).tagName !== "CANVAS") return;
        if (event.button !== 2 || (<HTMLElement>event.target).tagName !== "CANVAS") return;
        const tool = this.componentMap[this.currentTool];
        tool.onContextMenu(event, {});
        for (const permitted of tool.permittedTools)
            this.componentMap[permitted.name].onContextMenu(event, permitted.features);
    }

    touchstart(event: TouchEvent): void {
        if ((<HTMLElement>event.target).tagName !== "CANVAS") return;

        const tool = this.componentMap[this.currentTool];

        if (event.touches.length === 2) {
            tool.scaling = true;
        }

        if (tool.scaling) tool.onPinchStart(event, {});
        else tool.onTouchStart(event, {});
        for (const permitted of tool.permittedTools) {
            const otherTool = this.componentMap[permitted.name];
            otherTool.scaling = tool.scaling;
            if (otherTool.scaling) otherTool.onPinchStart(event, permitted.features);
            else otherTool.onTouchStart(event, permitted.features);
        }
    }

    touchend(event: TouchEvent): void {
        if ((<HTMLElement>event.target).tagName !== "CANVAS") return;

        const tool = this.componentMap[this.currentTool];

        if (tool.scaling) tool.onPinchEnd(event, {});
        else tool.onTouchEnd(event, {});
        tool.scaling = false;
        for (const permitted of tool.permittedTools) {
            const otherTool = this.componentMap[permitted.name];
            if (otherTool.scaling) otherTool.onPinchEnd(event, permitted.features);
            else otherTool.onTouchEnd(event, permitted.features);
            otherTool.scaling = false;
        }
    }

    touchmove(event: TouchEvent): void {
        if ((<HTMLElement>event.target).tagName !== "CANVAS") return;

        const tool = this.componentMap[this.currentTool];

        if (tool.scaling) {
            event.preventDefault();
            tool.onPinchMove(event, {});
        } else if (event.touches.length >= 3) {
            tool.onThreeTouchMove(event, {});
        } else {
            tool.onTouchMove(event, {});
        }

        for (const permitted of tool.permittedTools) {
            const otherTool = this.componentMap[permitted.name];
            if (otherTool.scaling) otherTool.onPinchMove(event, permitted.features);
            else if (event.touches.length >= 3) otherTool.onThreeTouchMove(event, permitted.features);
            else otherTool.onTouchMove(event, permitted.features);
        }

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

<template>
    <div style="pointer-events: auto;">
        <div id="toolselect">
            <ul>
                <li id="tool-mode">B</li>
                <li
                    v-for="tool in visibleTools"
                    :key="tool"
                    class="tool"
                    :class="{ 'tool-selected': currentTool === tool }"
                    :ref="tool + '-selector'"
                    @mousedown="currentTool = tool"
                >
                    <a href="#">{{ tool }}</a>
                </li>
            </ul>
        </div>
        <div>
            <template>
                <SelectTool v-show="currentTool === 'Select'" ref="selectTool"></SelectTool>
                <PanTool v-show="currentTool === 'Pan'" ref="panTool"></PanTool>
                <keep-alive>
                    <DrawTool v-show="currentTool === 'Draw'" ref="drawTool"></DrawTool>
                </keep-alive>
                <RulerTool v-show="currentTool === 'Ruler'" ref="rulerTool"></RulerTool>
                <PingTool v-show="currentTool === 'Ping'" ref="pingTool"></PingTool>
                <MapTool v-show="currentTool === 'Map'" ref="mapTool"></MapTool>
                <FilterTool v-show="currentTool === 'Filter'" ref="filterTool"></FilterTool>
                <VisionTool v-show="currentTool === 'Vision'" ref="visionTool"></VisionTool>
                <ShapeContext ref="shapecontext"></ShapeContext>
                <DefaultContext ref="defaultcontext"></DefaultContext>
                <CreateTokenModal ref="createtokendialog"></CreateTokenModal>
            </template>
        </div>
    </div>
</template>

<style scoped>
#toolselect {
    position: absolute;
    bottom: 25px;
    right: 25px;
    z-index: 10;
    display: flex;
    align-items: center;
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
    background-color: cadetblue;
    border-radius: 10px;
}

#tool-mode {
    align-self: center;
    border-right: 0;
    padding: 5px;
}

.tool {
    background-color: #eee;
    border-right: solid 1px #82c8a0;
}

.tool:last-child {
    border-right: solid 1px #82c8a0;
    border-radius: 0px 10px 10px 0px; /* Border radius needs to be two less than the actual border, otherwise there will be a gap */
}

#toolselect > ul > li:first-child + .tool {
    border-left: solid 2px #82c8a0;
    border-radius: 10px 0px 0px 10px;
    /* box-shadow: #82c8a0 -2px 1px; */
}

.tool:hover {
    background-color: #82c8a0;
}

.tool a {
    display: block;
    padding: 10px;
    text-decoration: none;
}

#toolselect .tool-selected {
    background-color: #82c8a0;
}
</style>

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
import RulerTool from "@/game/ui/tools/ruler.vue";
import SelectTool, { SelectFeatures } from "@/game/ui/tools/select.vue";
import Tool from "./tool.vue";
import VisionTool from "@/game/ui/tools/vision.vue";

import { layerManager } from "@/game/layers/manager";
import { gameManager } from "@/game/manager";
import { gameStore } from "@/game/store";
import { PingTool } from "@/game/ui/tools/ping";
import { l2g } from "@/game/units";
import { getLocalPointFromEvent } from "@/game/utils";
import { ToolName, ToolFeatures } from "./utils";
import { EventBus } from "@/game/event-bus";

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
        EventBus.$on("ToolMode.Toggle", this.toggleMode);
    }

    beforeDestroy(): void {
        EventBus.$off("ToolMode.Toggle");
    }

    currentTool = ToolName.Select;
    dmTools = [ToolName.Map];

    buildTools: [ToolName, ToolFeatures][] = [
        [ToolName.Select, {}],
        [ToolName.Pan, {}],
        [ToolName.Draw, {}],
        [ToolName.Ruler, {}],
        [ToolName.Map, {}],
        [ToolName.Filter, {}],
        [ToolName.Vision, {}],
    ];
    playTools: [ToolName, ToolFeatures][] = [
        [ToolName.Select, { disabled: [SelectFeatures.Resize] }],
        [ToolName.Pan, {}],
        [ToolName.Ruler, {}],
        [ToolName.Ping, {}],
        [ToolName.Filter, {}],
        [ToolName.Vision, {}],
    ];
    mode: "Build" | "Play" = "Play";

    get componentMap(): { [key in ToolName]: InstanceType<typeof Tool> } {
        return this.componentmap_;
    }

    get IS_DM(): boolean {
        return gameStore.IS_DM;
    }

    getCurrentToolComponent(): Tool {
        return this.componentMap[this.currentTool];
    }

    get tools(): [ToolName, ToolFeatures][] {
        return this.mode === "Build" ? this.buildTools : this.playTools;
    }

    get visibleTools(): string[] {
        return this.tools.map(t => t[0]).filter(t => (!this.dmTools.includes(t) || this.IS_DM) && this.toolVisible(t));
    }

    private getFeatures(tool: ToolName): ToolFeatures {
        return this.tools.find(t => t[0] === tool)?.[1] ?? {};
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
        tool.onMouseDown(event, this.getFeatures(targetTool));
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
        tool.onMouseUp(event, this.getFeatures(targetTool));
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
        tool.onMouseMove(event, this.getFeatures(targetTool));
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
            tool.onMouseUp(event, this.getFeatures(this.currentTool));
            for (const permitted of tool.permittedTools)
                this.componentMap[permitted.name].onMouseUp(event, permitted.features);
        }
    }
    contextmenu(event: MouseEvent): void {
        if ((<HTMLElement>event.target).tagName !== "CANVAS") return;
        if (event.button !== 2 || (<HTMLElement>event.target).tagName !== "CANVAS") return;
        const tool = this.componentMap[this.currentTool];
        tool.onContextMenu(event, this.getFeatures(this.currentTool));
        for (const permitted of tool.permittedTools)
            this.componentMap[permitted.name].onContextMenu(event, permitted.features);
    }

    touchstart(event: TouchEvent): void {
        if ((<HTMLElement>event.target).tagName !== "CANVAS") return;

        const tool = this.componentMap[this.currentTool];

        if (event.touches.length === 2) {
            tool.scaling = true;
        }

        if (tool.scaling) tool.onPinchStart(event, this.getFeatures(this.currentTool));
        else tool.onTouchStart(event, this.getFeatures(this.currentTool));
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

        if (tool.scaling) tool.onPinchEnd(event, this.getFeatures(this.currentTool));
        else tool.onTouchEnd(event, this.getFeatures(this.currentTool));
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
            tool.onPinchMove(event, this.getFeatures(this.currentTool));
        } else if (event.touches.length >= 3) {
            tool.onThreeTouchMove(event, this.getFeatures(this.currentTool));
        } else {
            tool.onTouchMove(event, this.getFeatures(this.currentTool));
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

    toggleMode(): void {
        this.mode = this.mode === "Build" ? "Play" : "Build";
    }

    getModeWord(): string {
        return this.mode === "Build" ? this.$t("tool.Build").toString() : this.$t("tool.Play").toString();
    }

    getToolWord(tool: string): string {
        switch (tool) {
            case ToolName.Select:
                return this.$t("tool.Select").toString();

            case ToolName.Pan:
                return this.$t("tool.Pan").toString();

            case ToolName.Draw:
                return this.$t("tool.Draw").toString();

            case ToolName.Ruler:
                return this.$t("tool.Ruler").toString();

            case ToolName.Ping:
                return this.$t("tool.Ping").toString();

            case ToolName.Map:
                return this.$t("tool.Map").toString();

            case ToolName.Filter:
                return this.$t("tool.Filter").toString();

            case ToolName.Vision:
                return this.$t("tool.Vision").toString();

            default:
                return "";
        }
    }
}
</script>

<template>
    <div style="pointer-events: auto;">
        <div id="toolselect">
            <ul>
                <li
                    v-for="tool in visibleTools"
                    :key="tool"
                    class="tool"
                    :class="{ 'tool-selected': currentTool === tool }"
                    :ref="tool + '-selector'"
                    @mousedown="currentTool = tool"
                >
                    <a href="#">{{ getToolWord(tool) }}</a>
                </li>
                <li id="tool-mode" @click="toggleMode" :title="$t('game.ui.tools.tools.change_mode')">
                    {{ getModeWord() }}
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
    font-size: 0;
}

#tool-mode::first-letter {
    font-size: 1rem;
}

#tool-mode:hover {
    cursor: pointer;
    font-size: 1em;
}

.tool {
    background-color: #eee;
    border-right: solid 1px #82c8a0;
}

#toolselect > ul > li:nth-last-child(2) {
    border-right: solid 1px #82c8a0;
    border-radius: 0px 10px 10px 0px; /* Border radius needs to be two less than the actual border, otherwise there will be a gap */
}

#toolselect > ul > li:first-child {
    border-left: solid 1px #82c8a0;
    border-radius: 10px 0px 0px 10px;
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

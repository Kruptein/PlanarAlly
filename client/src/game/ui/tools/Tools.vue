<script setup lang="ts">
import { computed } from "vue";
import type { CSSProperties } from "vue";
import { useI18n } from "vue-i18n";

import { gameStore } from "../../../store/game";
import { ToolMode, ToolName } from "../../models/tools";
import { activeModeTools, activeTool, activeToolMode, dmTools, toggleActiveMode, toolMap } from "../../tools/tools";

import DiceTool from "./DiceTool.vue";
import DrawTool from "./DrawTool.vue";
import FilterTool from "./FilterTool.vue";
import MapTool from "./MapTool.vue";
import RulerTool from "./RulerTool.vue";
import SelectTool from "./SelectTool.vue";
import SpellTool from "./SpellTool.vue";
import VisionTool from "./VisionTool.vue";

const { t } = useI18n();

function isToolVisible(tool: ToolName): boolean {
    if (tool === ToolName.Filter) {
        return gameStore.state.labels.size > 0;
    } else if (tool === ToolName.Vision) {
        return gameStore.state.ownedTokens.size > 1;
    }
    return true;
}

const visibleTools = computed(() => {
    {
        const tools = [];
        for (const [toolName] of activeModeTools.value) {
            if (dmTools.includes(toolName) && !gameStore.state.isDm) continue;
            if (!isToolVisible(toolName)) continue;

            const tool = toolMap[toolName];
            tools.push({
                name: toolName,
                translation: tool.toolTranslation,
                alert: tool.alert.value,
            });
        }
        return tools;
    }
});

function getStyle(tool: ToolMode): CSSProperties {
    if (tool === activeToolMode.value) {
        return {
            fontWeight: "bold",
            fontSize: "larger",
            textDecoration: "underline",
            textUnderlineOffset: "6px",
            textDecorationThickness: "3px",
        };
    }
    return { fontStyle: "italic" };
}

const toolModes = computed(() => {
    return [
        { name: t("tool.Build"), style: getStyle(ToolMode.Build) },
        { name: t("tool.Play"), style: getStyle(ToolMode.Play) },
    ];
});
</script>

<template>
    <div id="tools">
        <div id="toolselect">
            <ul>
                <li
                    v-for="tool in visibleTools"
                    :key="tool.name"
                    class="tool"
                    :class="{ 'tool-selected': activeTool === tool.name, 'tool-alert': tool.alert }"
                    :id="tool.name + '-selector'"
                    @mousedown="activeTool = tool.name"
                >
                    <a href="#">{{ tool.translation }}</a>
                </li>
                <li id="tool-mode"></li>
            </ul>
            <div id="tool-mode-full" @click="toggleActiveMode" :title="t('game.ui.tools.tools.change_mode')">
                <span v-for="mode of toolModes" :style="mode.style" :key="mode.name">{{ mode.name }}</span>
            </div>
        </div>
        <div>
            <SelectTool v-if="activeTool === ToolName.Select" />
            <SpellTool v-if="activeTool === ToolName.Spell" />
            <keep-alive>
                <DrawTool v-if="activeTool === ToolName.Draw" />
            </keep-alive>
            <RulerTool v-if="activeTool === ToolName.Ruler" />
            <MapTool v-if="activeTool === ToolName.Map" />
            <FilterTool v-if="activeTool === ToolName.Filter" />
            <VisionTool v-if="activeTool === ToolName.Vision" />
            <DiceTool v-if="activeTool === ToolName.Dice" />
        </div>
    </div>
</template>

<style scoped lang="scss">
#tools > * {
    pointer-events: auto;
}

#toolselect {
    position: absolute;
    bottom: 15px;
    right: 25px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;

    * {
        user-select: none !important;
        -webkit-user-drag: none !important;
    }

    .tool-selected {
        background-color: #82c8a0;
    }

    .tool-alert {
        background-color: #ff7052;
    }

    > ul {
        display: flex;
        list-style: none;
        padding: 0;
        margin: 0;
        border: solid 1px cadetblue;
        background-color: cadetblue;
        border-radius: 10px 10px 0 10px;

        > li {
            &:first-child {
                border-left: solid 1px #82c8a0;
                border-radius: 10px 0px 0px 10px;
            }

            &:nth-last-child(2) {
                border-right: solid 1px #82c8a0;
                border-radius: 0px 10px 10px 0px; /* Border radius needs to be two less than the actual border, otherwise there will be a gap */
            }
        }

        #tool-mode {
            padding: 5px;
        }
    }

    #tool-mode-full {
        background-color: cadetblue;
        padding: 0.3em 0.75em;
        border-radius: 0 0 10px 10px;

        span + span {
            padding-left: 10px;
        }
    }
}

.tool {
    background-color: #eee;
    border-right: solid 1px #82c8a0;

    &:hover {
        background-color: #82c8a0;
    }

    a {
        display: block;
        padding: 10px;
        text-decoration: none;
    }
}
</style>

<style lang="scss">
.tool-detail {
    position: absolute;
    right: var(--detailRight);
    bottom: 105px;
    /* width: 150px; */
    border: solid 1px #2b2b2b;
    background-color: white;
    display: grid;
    padding: 10px;
    /* grid-template-columns: 50% 50%; */
    grid-template-columns: auto auto;
    grid-column-gap: 5px;
    grid-row-gap: 2px;

    &:after {
        content: "";
        position: absolute;
        right: var(--detailArrow);
        bottom: 0;
        width: 0;
        height: 0;
        border: 14px solid transparent;
        border-top-color: black;
        border-bottom: 0;
        margin-left: -14px;
        margin-bottom: -14px;
    }

    input {
        width: 100%;
        box-sizing: border-box;
    }
}
</style>

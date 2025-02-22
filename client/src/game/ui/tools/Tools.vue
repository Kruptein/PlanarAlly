<script setup lang="ts">
import { computed } from "vue";
import type { CSSProperties } from "vue";
import { useI18n } from "vue-i18n";

import { baseAdjust } from "../../../core/http";
import { ToolMode, ToolName } from "../../models/tools";
import { accessState } from "../../systems/access/state";
import { gameSystem } from "../../systems/game";
import { gameState } from "../../systems/game/state";
import { roomState } from "../../systems/room/state";
import { playerSettingsState } from "../../systems/settings/players/state";
import { activeModeTools, activeTool, activeToolMode, dmTools, toggleActiveMode, toolMap } from "../../tools/tools";
import { initiativeStore } from "../initiative/state";

import DiceTool from "./DiceTool.vue";
import DrawTool from "./DrawTool.vue";
import MapTool from "./MapTool.vue";
import RulerTool from "./RulerTool.vue";
import SelectTool from "./SelectTool.vue";
import SpellTool from "./SpellTool.vue";
import VisionTool from "./VisionTool.vue";

const { t } = useI18n();

const detailBottom = computed(() => (playerSettingsState.reactive.useToolIcons.value ? "7.8rem" : "6.6rem"));

const visibleTools = computed(() => {
    {
        const tools = [];
        for (const [toolName] of activeModeTools.value) {
            if (dmTools.includes(toolName) && !gameState.reactive.isDm) continue;

            if (toolName === ToolName.Vision) {
                if (accessState.reactive.ownedTokens.size <= 1) continue;
            } else if (toolName === ToolName.Dice) {
                if (!roomState.reactive.enableDice) continue;
            }

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

function getStaticToolImg(img: string): string {
    return baseAdjust(`/static/img/tools/${img}`);
}

const toolModes = computed(() => {
    return [
        { name: t("tool.Build"), style: getStyle(ToolMode.Build) },
        { name: t("tool.Play"), style: getStyle(ToolMode.Play) },
    ];
});

function toggleFakePlayer(): void {
    gameSystem.setFakePlayer(!gameState.raw.isFakePlayer);
}
</script>

<template>
    <div id="tools" :style="{ '--detailBottom': detailBottom }">
        <div id="toolselect">
            <ul>
                <li
                    v-for="tool in visibleTools"
                    :id="tool.name + '-selector'"
                    :key="tool.name"
                    class="tool"
                    :class="{ 'tool-selected': activeTool === tool.name, 'tool-alert': tool.alert }"
                    @click.prevent="activeTool = tool.name"
                >
                    <a href="#" :title="tool.translation">
                        <template v-if="playerSettingsState.reactive.useToolIcons.value">
                            <img :src="getStaticToolImg(`${tool.name.toLowerCase()}.svg`)" :alt="tool.translation" />
                        </template>
                        <template v-else>{{ tool.translation }}</template>
                    </a>
                </li>
                <li id="tool-mode"></li>
            </ul>
            <div id="tool-status">
                <div v-if="gameState.isDmOrFake.value" id="tool-status-toggles">
                    <div
                        :class="{ active: gameState.reactive.isFakePlayer }"
                        :title="t('game.ui.tools.tools.FP_title')"
                        @click="toggleFakePlayer"
                    >
                        {{ t("game.ui.tools.tools.FP") }}
                    </div>
                    <div
                        :class="{ active: initiativeStore.state.isActive }"
                        :title="t('game.ui.tools.tools.INI_title')"
                        @click="initiativeStore.toggleActive"
                    >
                        {{ t("game.ui.tools.tools.INI") }}
                    </div>
                </div>
                <div style="flex-grow: 1"></div>
                <div id="tool-status-modes" :title="t('game.ui.tools.tools.change_mode')" @click="toggleActiveMode">
                    <span v-for="mode of toolModes" :key="mode.name" :style="mode.style">{{ mode.name }}</span>
                </div>
            </div>
        </div>
        <div>
            <SelectTool v-lazy-show="activeTool === ToolName.Select" />
            <SpellTool v-lazy-show="activeTool === ToolName.Spell" />
            <DrawTool v-lazy-show="activeTool === ToolName.Draw" />
            <RulerTool v-lazy-show="activeTool === ToolName.Ruler" />
            <MapTool v-lazy-show="activeTool === ToolName.Map" />
            <VisionTool v-lazy-show="activeTool === ToolName.Vision" />
            <DiceTool v-lazy-show="roomState.reactive.enableDice && activeTool === ToolName.Dice" />
        </div>
    </div>
</template>

<style scoped lang="scss">
#tools > * {
    pointer-events: auto;
}

#toolselect {
    position: absolute;
    bottom: 0.8rem;
    right: 25px;
    display: flex;
    flex-direction: column;

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

    #tool-status {
        display: flex;

        #tool-status-toggles {
            padding-top: 0.3em;
            display: flex;

            > div {
                margin: 0 0.5rem;
                background-color: rgba(0, 0, 0, 0.25);
                padding: 5px;
                border-radius: 7px;
                border: solid 2px white;
                color: white;

                &:hover {
                    cursor: pointer;
                }

                &.active {
                    border-color: #39ff14;
                    color: #39ff14;
                }
            }
        }

        #tool-status-modes {
            background-color: cadetblue;
            padding: 0.3em 0.75em;
            border-radius: 0 0 10px 10px;

            span + span {
                padding-left: 10px;
            }
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
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 0.625rem;
        text-decoration: none;

        > img {
            height: 2.5rem;
            width: 2.5rem;
        }
    }
}
</style>

<style lang="scss">
.tool-detail {
    position: absolute;

    bottom: var(--detailBottom);
    right: 25px;
    padding: 1rem;

    border: solid 1px #2b2b2b;
    border-radius: 1rem;

    background-color: white;

    input {
        width: 100%;
        box-sizing: border-box;
    }
}
</style>

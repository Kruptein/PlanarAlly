<script setup lang="ts">
import { type Part, type RollResult } from "@planarally/dice/core";
import { DxConfig, DxSegmentType, type DxSegment } from "@planarally/dice/systems/dx";
import { type DeepReadonly, computed, nextTick, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import type { DiceRollResult } from "../../../apiTypes";
import ClickGroup from "../../../core/components/ClickGroup.vue";
import { arrToToggleGroup } from "../../../core/components/toggleGroup";
import ToggleGroup from "../../../core/components/ToggleGroup.vue";
import { diceSystem } from "../../systems/dice";
import { DxHelper } from "../../systems/dice/dx";
import { diceState } from "../../systems/dice/state";
import { diceTool } from "../../tools/variants/dice";

const { t } = useI18n();

// const limitOperatorOptionNames = [t('game.ui.tools.DiceTool.limit_operator_options.keep'), t('game.ui.tools.DiceTool.limit_operator_options.drop'), t('game.ui.tools.DiceTool.limit_operator_options.min'), t('game.ui.tools.DiceTool.limit_operator_options.max')]
// const selectorOptionNames = ["=", ">", "<", t('game.ui.tools.DiceTool.selection_option_names.highest'), t('game.ui.tools.DiceTool.selection_option_names.lowest')]

const dice3dOptions = ["off", "on", "box"] as const;
const dice3dSetting = ref<(typeof dice3dOptions)[number]>("off");

const shareResultOptions = ["all", "dm", "none"] as const;
const shareResult = ref<(typeof shareResultOptions)[number]>("all");

const breakdownDetailOptions = ["detailed", "simple"] as const;
const breakdownDetailOptionHistory = ref<(typeof breakdownDetailOptions)[number]>(
    (localStorage.getItem("diceTool.breakdownDetailOptionHistory") as (typeof breakdownDetailOptions)[number]) ??
        "detailed",
);
const breakdownDetailOptionLastRoll = ref<(typeof breakdownDetailOptions)[number]>(
    (localStorage.getItem("diceTool.breakdownDetailOptionLastRoll") as (typeof breakdownDetailOptions)[number]) ??
        "detailed",
);

// track if temporarily enabled via the option within a history item
const enableDetailedHistoryBreakdown = ref(breakdownDetailOptionHistory.value === "detailed");

const showAdvancedOptions = ref(false);
const showRollHistory = ref(false);
const showHistoryBreakdownFor = ref<number | null>(null);

const canvasElement = ref<HTMLCanvasElement | null>(null);
const inputElement = ref<HTMLInputElement | null>(null);

const translationMapping = {
    dice3dOptions: {
        ["off"]: t("game.ui.tools.DiceTool.3D_options.off"),
        ["on"]: t("game.ui.tools.DiceTool.3D_options.on"),
        ["box"]: t("game.ui.tools.DiceTool.3D_options.box"),
    },
    shareResultOptions: {
        ["all"]: t("game.ui.tools.DiceTool.share_options.all"),
        ["dm"]: t("game.ui.tools.DiceTool.share_options.dm"),
        ["none"]: t("game.ui.tools.DiceTool.share_options.none"),
    },
    breakdownDetailOptions: {
        ["detailed"]: t("game.ui.tools.DiceTool.breakdown_options.detailed"),
        ["simple"]: t("game.ui.tools.DiceTool.breakdown_options.simple"),
    },
};

const showOptionsSubmenu = ref(false);
const awaitingRoll = ref(false);
const awaiting3dLoad = ref(false);
const lastRoll = ref<RollResult<Part>>({
    result: "-",
    parts: [{ input: undefined, shortResult: t("game.ui.tools.DiceTool.empty_history") }],
});

const literalOptions = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ...DxConfig.symbolOptions] as const;

const input = ref<DxSegment[]>([]);
const lastSeg = computed(() => input.value.at(-1));

watch(breakdownDetailOptionHistory, () => {
    localStorage.setItem("diceTool.breakdownDetailOptionHistory", breakdownDetailOptionHistory.value);
});

watch(breakdownDetailOptionLastRoll, () => {
    localStorage.setItem("diceTool.breakdownDetailOptionLastRoll", breakdownDetailOptionLastRoll.value);
});

watch(showHistoryBreakdownFor, () => {
    enableDetailedHistoryBreakdown.value = breakdownDetailOptionHistory.value === "detailed";
});

watch(dice3dSetting, async (value) => {
    if (value === "on") {
        awaiting3dLoad.value = true;
        await diceSystem.load3d();
        awaiting3dLoad.value = false;
    } else if (value === "box") {
        awaiting3dLoad.value = true;
        await diceSystem.load3d(canvasElement.value!);
        awaiting3dLoad.value = false;
    }
});

const showOperator = computed(() => {
    const seg = lastSeg.value;
    return seg?.type === DxSegmentType.Die && seg.selector === undefined && seg.selectorValue === undefined;
});

const showSelector = computed(() => {
    const seg = lastSeg.value;
    return (
        seg?.type === DxSegmentType.Die &&
        seg.operator !== undefined &&
        seg.operator !== "min" &&
        seg.operator !== "max" &&
        seg.selectorValue === undefined &&
        seg.selector === undefined
    );
});

const inputText = ref("");
watch(
    input,
    async (parts) => {
        inputText.value = DxHelper.stringifySegments(parts);
        await nextTick();
        inputElement.value!.scrollLeft = inputElement.value!.scrollWidth;
    },
    { deep: true },
);

function scrollToHistoryEntry(element: Element): void {
    element.scrollIntoView({ block: "end", behavior: "smooth" });
}

function clear(): void {
    input.value = [];
}

function addDie(die: (typeof DxConfig.addOptions)[number]): void {
    DxHelper.addDie(input, die);
}

function addOperator(
    operator: (typeof DxConfig.limitOperatorOptions)[number] | (typeof DxConfig.rerollOperatorOptions)[number],
): void {
    const seg = lastSeg.value;
    if (seg?.type !== DxSegmentType.Die) return;
    seg.operator = operator;
}

function addSelector(selector: (typeof DxConfig.selectorOptions)[number]): void {
    const seg = lastSeg.value;
    if (seg?.type !== DxSegmentType.Die) return;
    seg.selector = selector;
}

function addLiteral(literal: (typeof literalOptions)[number]): void {
    const literalAsOperator = literal as (typeof DxConfig.symbolOptions)[number];

    if (DxConfig.symbolOptions.includes(literalAsOperator)) {
        input.value.push({ type: DxSegmentType.Operator, input: literalAsOperator });
    } else {
        const value = Number.parseInt(literal);
        DxHelper.addLiteral(input, value);
    }
}

function updateFromString(event: Event): void {
    input.value = diceState.raw.systems!["2d"].parse((event.target as HTMLInputElement).value);
}

function populateInputFromHistoryRoll(roll: DeepReadonly<RollResult<Part>>): void {
    const parts = roll.parts;

    let content = "";

    for (const part of parts) {
        content += part.input ?? "";
    }
    input.value = diceState.raw.systems!["2d"].parse(content);
}

function populateInputFromHistoryIndex(index: number): void {
    const historyItem = diceState.reactive.history[index];
    if (historyItem === null || historyItem === undefined) return;
    populateInputFromHistoryRoll(historyItem.roll);
}

async function roll(): Promise<void> {
    if (inputText.value.length === 0) return;

    clear();
    awaitingRoll.value = true;

    lastRoll.value = await diceTool.roll(
        inputText.value,
        dice3dSetting.value !== "off",
        shareResult.value.toLowerCase() as DiceRollResult["shareWith"],
    );

    // These lines are required to make sure that the transition for lastroll-results plays,
    // This covers the case of multiple 3D dice rolls awaiting results simultaneously. When one
    // finishes, the awaitingRoll value is updated to false and the value is shown. If another
    // of the rolls finishes, it will not play a transition because awaitingRoll did not change.
    // Therefore, we change this value here to force an update and play the transition.
    awaitingRoll.value = true;
    await nextTick();

    awaitingRoll.value = false;
}
</script>

<template>
    <div id="dice" class="tool-detail">
        <Transition name="dice-expand">
            <div v-show="dice3dSetting === 'box'" class="dice-roller-box">
                <div class="dice-canvas-container">
                    <canvas id="dice-canvas" ref="canvasElement" />
                </div>
            </div>
        </Transition>
        <div id="lastroll-container" class="history-breakdown">
            <div id="lastroll-result">
                <Transition :name="awaitingRoll ? 'fast-fade' : 'get-result'" mode="out-in">
                    <div v-if="awaitingRoll">-</div>
                    <div v-else>
                        {{ lastRoll.result }}
                    </div>
                </Transition>
            </div>
            <div class="breakdown-scroll-container">
                <Transition name="fast-fade" mode="out-in">
                    <div v-if="awaitingRoll" class="breakdown-flex-container">
                        <div style="font-style: italic">{{ t("game.ui.tools.DiceTool.rolling") }}</div>
                    </div>
                    <div v-else class="breakdown-flex-container">
                        <div v-for="[index, part] of lastRoll.parts.entries()" :key="index">
                            <div v-if="lastRoll.result === '-'" style="font-style: italic">
                                <!-- starting state -->
                                {{ part.shortResult }}
                            </div>
                            <div v-else-if="part.longResult" class="dice-result" :title="part.longResult">
                                <div class="input">{{ part.input ?? "" }}</div>
                                <div v-if="breakdownDetailOptionLastRoll === 'detailed'" class="ops">
                                    {{ "(" + part.longResult.replaceAll(",", " + ") + ")" }}
                                </div>
                                <div class="value">{{ part.shortResult }}</div>
                            </div>
                            <div
                                v-else-if="part.shortResult === '+' || part.shortResult === '-'"
                                class="operator-result"
                            >
                                {{ part.shortResult }}
                            </div>
                            <div v-else class="literal-result">
                                {{ part.shortResult }}
                            </div>
                        </div>
                    </div>
                </Transition>
            </div>
        </div>
        <div
            class="drawer-toggle"
            :title="t('game.ui.tools.DiceTool.full_history_title')"
            @click="showRollHistory = !showRollHistory"
        >
            <div class="toggle-label">{{ t("game.ui.tools.DiceTool.full_history") }}</div>
            <font-awesome-icon class="toggle-chevron" :icon="showRollHistory ? 'minus' : 'plus'" />
        </div>
        <div class="drawer-transition-wrapper">
            <Transition name="drawer-expand">
                <div v-show="showRollHistory" id="dice-history-drawer" class="drawer">
                    <!--Make scrollbar conform to border-radius-->
                    <div id="dice-history">
                        <div
                            v-for="[i, { name, roll: historyRoll, player }] of diceState.reactive.history.entries()"
                            :key="i"
                            class="dice-history-entry-wrapper"
                        >
                            <div
                                class="dice-history-entry"
                                :class="{ 'highlighted-history-entry': showHistoryBreakdownFor === i }"
                                :title="t('game.ui.tools.DiceTool.toggle_breakdown')"
                                @click="showHistoryBreakdownFor = showHistoryBreakdownFor === i ? null : i"
                            >
                                <div class="history-grid-user">{{ player }}</div>
                                <div class="history-grid-input">{{ name }}</div>
                                <div class="history-grid-result">{{ historyRoll.result }}</div>
                                <div class="toggle-chevron">
                                    <font-awesome-icon
                                        :icon="showHistoryBreakdownFor === i ? 'chevron-up' : 'chevron-down'"
                                    />
                                </div>
                            </div>
                            <div class="drawer-transition-wrapper" style="margin: 0">
                                <Transition name="drawer-expand" @after-enter="scrollToHistoryEntry">
                                    <div v-if="showHistoryBreakdownFor === i" class="history-breakdown">
                                        <div class="history-item-buttons">
                                            <button
                                                class="detail-toggle-button"
                                                @click="
                                                    enableDetailedHistoryBreakdown = !enableDetailedHistoryBreakdown
                                                "
                                            >
                                                {{ t("game.ui.tools.DiceTool.details") }}
                                            </button>
                                            <button class="reroll-button" @click="populateInputFromHistoryIndex(i)">
                                                {{ t("game.ui.tools.DiceTool.reroll") }}
                                            </button>
                                        </div>
                                        <div class="breakdown-scroll-container">
                                            <div class="breakdown-flex-container">
                                                <div v-for="[index, part] of historyRoll.parts.entries()" :key="index">
                                                    <div
                                                        v-if="part.longResult"
                                                        class="dice-result"
                                                        :title="part.longResult"
                                                    >
                                                        <div class="input">{{ part.input ?? "" }}</div>
                                                        <div v-if="enableDetailedHistoryBreakdown" class="ops">
                                                            {{ "(" + part.longResult.replaceAll(",", " + ") + ")" }}
                                                        </div>
                                                        <div class="value">{{ part.shortResult }}</div>
                                                    </div>
                                                    <div
                                                        v-else-if="part.shortResult === '+' || part.shortResult === '-'"
                                                        class="operator-result"
                                                    >
                                                        {{ part.shortResult }}
                                                    </div>
                                                    <div v-else class="literal-result">
                                                        {{ part.shortResult }}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Transition>
                            </div>
                        </div>
                        <div v-if="diceState.reactive.history.length === 0" id="dice-history-empty">
                            {{ t("game.ui.tools.DiceTool.empty_history") }}
                        </div>
                    </div>
                </div>
            </Transition>
        </div>
        <div id="options-cluster">
            <Transition
                name="options-slide"
                :enter-from-class="showOptionsSubmenu ? 'slide-left-enter' : 'slide-right-enter'"
                :enter-active-class="showOptionsSubmenu ? 'slide-left-enter-active' : 'slide-right-enter-active'"
                :leave-to-class="showOptionsSubmenu ? 'slide-right-leave' : 'slide-left-leave'"
            >
                <div v-if="!showOptionsSubmenu" id="common-options">
                    <div class="vertical-label-plus-group">
                        <label>{{ t("game.ui.tools.DiceTool.3D_dice") }}</label>
                        <ToggleGroup
                            v-model="dice3dSetting"
                            class="click-group"
                            :options="arrToToggleGroup(dice3dOptions, translationMapping.dice3dOptions)"
                            :multi-select="false"
                            :disabled="awaiting3dLoad"
                        />
                    </div>
                    <div class="vertical-label-plus-group">
                        <label>{{ t("game.ui.tools.DiceTool.share") }}</label>
                        <ToggleGroup
                            v-model="shareResult"
                            class="click-group"
                            :options="arrToToggleGroup(shareResultOptions, translationMapping.shareResultOptions)"
                            :multi-select="false"
                        />
                    </div>
                    <font-awesome-icon
                        id="open-options-button"
                        icon="cog"
                        class="svg-button"
                        :title="t('game.ui.tools.DiceTool.open_options_title')"
                        @click="showOptionsSubmenu = true"
                    />
                </div>
                <div v-else id="options-submenu" class="drawer-transition-wrapper">
                    <div class="side-drawer">
                        <div class="vertical-label-plus-group">
                            <label>{{ t("game.ui.tools.DiceTool.history") }}</label>
                            <ToggleGroup
                                v-model="breakdownDetailOptionHistory"
                                class="click-group"
                                :options="
                                    arrToToggleGroup(breakdownDetailOptions, translationMapping.breakdownDetailOptions)
                                "
                                :multi-select="false"
                            />
                        </div>
                        <div class="vertical-label-plus-group">
                            <label>{{ t("game.ui.tools.DiceTool.previous_roll") }}</label>
                            <ToggleGroup
                                v-model="breakdownDetailOptionLastRoll"
                                class="click-group"
                                :options="
                                    arrToToggleGroup(breakdownDetailOptions, translationMapping.breakdownDetailOptions)
                                "
                                :multi-select="false"
                            />
                        </div>
                        <font-awesome-icon
                            id="close-options-button"
                            icon="chevron-left"
                            class="svg-button"
                            @click="showOptionsSubmenu = false"
                        />
                    </div>
                </div>
            </Transition>
        </div>
        <div
            class="drawer-toggle"
            :title="t('game.ui.tools.DiceTool.toggle_advanced')"
            @click="showAdvancedOptions = !showAdvancedOptions"
        >
            <div class="toggle-label">{{ t("game.ui.tools.DiceTool.advanced") }}</div>
            <font-awesome-icon class="toggle-chevron" :icon="showAdvancedOptions ? 'minus' : 'plus'" />
        </div>
        <div class="drawer-transition-wrapper">
            <Transition name="drawer-expand">
                <div v-if="showAdvancedOptions" id="advanced-config-drawer" class="drawer">
                    <div class="label-plus-group">
                        <label>{{ t("game.ui.tools.DiceTool.advanced_options.operators") }}</label>
                        <ClickGroup
                            class="click-group"
                            :options="DxConfig.limitOperatorOptions"
                            :disabled="!showOperator"
                            @click="addOperator"
                        />
                    </div>
                    <div class="label-plus-group">
                        <label>{{ t("game.ui.tools.DiceTool.advanced_options.selectors") }}</label>
                        <ClickGroup
                            class="click-group"
                            :options="DxConfig.selectorOptions"
                            :disabled="!showSelector"
                            @click="addSelector"
                        />
                    </div>
                </div>
            </Transition>
        </div>
        <div id="literal-selector">
            <ClickGroup class="click-group" :options="literalOptions" @click="addLiteral" />
        </div>
        <div id="dice-selector">
            <ClickGroup class="click-group" :options="DxConfig.addOptions" :disabled="showSelector" @click="addDie" />
            <font-awesome-icon
                id="reroll-previous-button"
                :class="{ disabled: lastRoll.result === '-' }"
                class="svg-button"
                icon="rotate-left"
                :title="t('game.ui.tools.DiceTool.reroll_previous_title')"
                @click="lastRoll.result === '-' ? {} : populateInputFromHistoryRoll(lastRoll)"
            />
        </div>
        <div id="buttons">
            <div id="input-bar">
                <input
                    id="input"
                    ref="inputElement"
                    v-model="inputText"
                    type="text"
                    @change="updateFromString"
                    @keyup.enter="roll"
                />
                <font-awesome-icon
                    v-show="inputText.length > 0"
                    id="clear-input-icon"
                    icon="circle-xmark"
                    :title="t('game.ui.tools.DiceTool.clear_selection_title')"
                    @click.stop="clear"
                />
            </div>
            <font-awesome-icon
                id="roll-button"
                :class="{ disabled: inputText.length === 0 }"
                class="svg-button"
                icon="dice-six"
                :title="t('game.ui.tools.DiceTool.roll')"
                @click="roll"
            />
        </div>
    </div>
</template>

<style scoped lang="scss">
#dice {
    overflow: hidden;
    width: 26rem;
    display: flex;
    flex-direction: column;

    /*********
     * Classes
     *********/

    .vertical-label-plus-group,
    .label-plus-group {
        display: flex;
        align-items: center;
        margin: 0.25rem 0;
        justify-content: space-between;
        font-size: 90%;
    }
    .vertical-label-plus-group {
        flex-direction: column;
    }

    .click-group {
        transition: opacity 0.1s linear;
        outline: none;
        border: solid 1px black;
        margin: 0 0.5rem;
        font-size: 90%;
    }

    .svg-button {
        font-size: 75%;
        &:hover:not(.disabled) {
            transition: all 0.05s linear;
            transform: scale(105%);
            cursor: pointer;
        }
        &:hover.disabled {
            cursor: auto;
        }
        &:active:not(.disabled) {
            transform: scale(95%);
        }
        &.disabled {
            transition:
                all 0.1s linear,
                opacity 0.1s linear 0.1s;
            opacity: 25%;
        }
    }

    .drawer-toggle {
        display: flex;
        justify-content: end;
        align-items: center;
        align-self: end;

        margin: 0.25rem 0;
        padding-bottom: 0;

        border-radius: 1rem;
        font-size: 85%;

        &:hover {
            cursor: pointer;
        }

        > .toggle-chevron {
            font-size: 80%;
            margin-left: 0.5rem;
        }
    }

    .history-breakdown {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;

        &:before {
            pointer-events: none;
            content: "";
            border-radius: inherit;
            position: absolute;
            left: 0;
            right: 0;
            top: 0;
            bottom: 0;
            box-shadow:
                inset 0 8px 10px -10px black,
                inset 0 -5px 13px -13px black,
                inset 4px 0 13px -13px black,
                inset -4px 0 13px -13px black;
        }

        > .history-item-buttons {
            flex: 0 0 auto;
            display: flex;
            justify-content: end;
            align-self: stretch;

            button {
                margin: 0.5rem 1rem 0 0.5rem;
                border-radius: 0.5rem;
            }
        }
        > .breakdown-scroll-container {
            display: flex;
            justify-content: start;
            padding: 0.25rem 0.5rem;
            flex-grow: 1;
            width: 100%;
            overflow-x: auto;
            scrollbar-width: thin;

            > .breakdown-flex-container {
                display: flex;
                flex: 1 0 auto;
                align-items: center;
                justify-content: safe center;
                padding: 0.25rem 0.5rem;

                > div {
                    > div {
                        padding: 0.25rem 0.5rem;
                        border-radius: 0.5rem;
                    }
                    > .dice-result {
                        display: flex;
                        flex-direction: column;
                        align-items: center;

                        background-color: rgba(235, 240, 245, 1);

                        > .ops {
                            white-space: nowrap;
                        }
                        > .value {
                            font-weight: bold;
                            font-size: 125%;
                        }
                    }

                    > .literal-result {
                        background-color: rgba(235, 240, 245, 1);
                        font-weight: bold;
                        font-size: 125%;
                    }
                    > .operator-result {
                        font-weight: bold;
                    }
                }
            }
        }
    }

    .side-drawer {
        padding-left: 1rem;
        padding-right: 1rem;
        box-shadow:
            inset 0 5px 10px -10px black,
            inset 0 -3px 10px -10px black,
            inset 3px 0 10px -10px black,
            inset -3px 0 10px -10px black,
            inset 0 1px black,
            inset 0 -1px black;
        background-color: rgba(250, 253, 255, 1);
    }
    .drawer {
        padding-left: 1rem;
        padding-right: 1rem;
        box-shadow:
            inset 0 5px 10px -10px black,
            inset 0 -3px 10px -10px black,
            inset 3px 0 10px -10px black,
            inset -3px 0 10px -10px black;

        border-bottom: solid 1px black;
        border-top: solid 1px black;
        background-color: rgba(250, 253, 255, 1);
    }
    .drawer-transition-wrapper {
        margin: 0 -1rem 0 -1rem;
        overflow-y: hidden;
    }

    .dice-roller-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        padding-bottom: 1rem;

        .dice-canvas-container {
            position: relative;
            margin: 0;
            padding: 0;
            border-radius: 1rem;
            overflow: hidden;

            display: flex;
            align-items: center;
            justify-content: center;

            max-width: 380px;
            max-height: 340px;
            min-height: 340px;

            &:before {
                pointer-events: none;
                content: "";
                border-radius: inherit;
                position: absolute;
                left: 0;
                right: 0;
                top: 0;
                bottom: 0;
                box-shadow:
                    inset 0 8px 10px -10px black,
                    inset 0 -5px 13px -13px black,
                    inset 4px 0 13px -13px black,
                    inset -4px 0 13px -13px black;
            }
            #dice-canvas {
                margin: 0;
                padding: 0;
                max-width: 380px;
                max-height: 340px;
                height: 340px;
            }
        }
    }

    /******
     * IDs
     ******/

    #lastroll-container {
        height: 6.5rem;
        max-height: 6.5rem;
        width: 0;
        min-width: 100%;
        margin: 0;
        padding: 0;
        border-radius: 1em;
        overflow: hidden;

        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;

        > #lastroll-result {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            margin: 0.75rem;
            margin-right: 0;
            font-size: 200%;
            font-weight: bold;
            min-width: 5rem;
            max-width: 5rem;
            max-height: 5rem;
            min-height: 5rem;
            border: solid 4px black;
            border-radius: 0.5rem;
        }
    }

    #dice-history-drawer {
        padding: 0;

        > #dice-history {
            display: flex;
            flex-direction: column;
            max-height: 10rem;
            padding: 0;

            overflow-y: scroll;
            scrollbar-width: thin;
            overflow-anchor: none;

            &.single-entry {
                overflow-y: auto;
            }

            > .dice-history-entry-wrapper {
                display: flex;
                flex-direction: column;

                > .dice-history-entry {
                    display: grid;
                    grid-template-columns: 6rem 1fr 3rem auto;
                    column-gap: 0.25rem;
                    align-items: center;
                    padding: 0.25rem 1rem;

                    > .history-grid-user,
                    > .history-grid-result {
                        text-overflow: ellipsis;
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    > .history-grid-input {
                        white-space: break-spaces;
                    }

                    > .history-grid-result {
                        font-weight: bold;
                    }

                    > .toggle-chevron {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        font-size: 70%;
                    }

                    &:hover {
                        background-color: rgba(235, 240, 245, 1);
                        cursor: pointer;
                    }
                }
                > .highlighted-history-entry {
                    background-color: rgba(215, 225, 235, 1);
                    &:hover {
                        background-color: rgba(195, 205, 215, 1);
                        cursor: pointer;
                    }
                }
            }

            > #dice-history-empty {
                padding: 0.25rem 1rem;
                font-style: italic;
                align-self: center;
            }
        }
    }

    #options-cluster {
        position: relative;

        #common-options {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin: 0.25rem 0;

            > #open-options-button {
                padding: 0.75rem 0.25rem;
                margin-left: -2rem;
                font-size: 125%;
            }
        }
        > #options-submenu {
            > div {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin: 0.25rem 0;

                > #close-options-button {
                    padding: 0.75rem 0.25rem;
                    margin-left: -2rem;
                    font-size: 125%;
                }
            }
        }
    }

    #toggle-advanced {
        font-weight: normal;
        font-style: italic;

        &:hover {
            cursor: pointer;
        }
    }

    #literal-selector {
        margin-top: 0.5rem;
        align-self: start;

        display: flex;
        align-items: center;
        row-gap: 0.25rem;

        user-select: none;
    }

    #dice-selector {
        margin-bottom: 0.5rem;
        margin-top: 0.5rem;

        display: flex;
        align-items: center;
        justify-content: space-between;
        row-gap: 0.25rem;

        user-select: none;

        > #reroll-previous-button {
            flex: 0 0 auto;
            padding-right: 0.125rem;
            font-size: 1.75em;
        }
    }

    #buttons {
        display: flex;
        justify-content: space-between;
        align-items: center;

        > #input-bar {
            flex: 1 0 0;
            display: flex;
            align-items: center;
            border: solid 1px black;
            border-radius: 0.5rem;
            padding: 0.25rem 0.5rem;
            margin: 0 0.5rem;
            > input {
                border-radius: 0.5rem;
                font-size: 110%;
                outline: none;
                border: none;
                flex: 1 1 auto;
            }
            > #clear-input-icon {
                padding: 0.25rem 0.25rem;
                font-size: 85%;
            }
        }
        > #roll-button {
            flex: 0 0 auto;
            padding: 0.25rem;
            font-size: 1.75em;
        }
    }

    /*************
     * Transitions
     *************/

    .slide-left-enter {
        position: absolute;
        top: 0;
        width: calc(100% + 2rem);
        transform: translate(-100%, 0);
    }
    .slide-right-enter {
        position: absolute;
        top: 0;
        width: 100%;
        transform: translate(100%, 0);
    }
    .slide-left-leave {
        transform: translate(-100%, 0);
    }
    .slide-right-leave {
        transform: translate(100%, 0);
    }

    .slide-left-enter-active,
    .slide-right-enter-active {
        transition: all 0.3s ease;
        position: absolute;
        top: 0;
    }
    .slide-left-enter-active {
        width: calc(100% + 2rem);
    }
    .slide-right-enter-active {
        width: 100%;
    }
    .options-slide-leave-active {
        transition: all 0.3s ease;
    }

    .dice-expand-enter-active {
        transition:
            all 0.3s ease,
            opacity 0.2s linear;
        max-height: calc(340px + 1rem);
        padding-bottom: 1rem;
    }
    .dice-expand-leave-active {
        transition:
            all 0.3s ease,
            opacity 0.2s linear 0.1s;
        max-height: calc(340px + 1rem);
        padding-bottom: 1rem;
    }
    .dice-expand-enter-from,
    .dice-expand-leave-to {
        opacity: 0;
        max-height: 0;
        padding-bottom: 0;
    }

    .get-result-enter-active {
        backface-visibility: hidden;
        transition:
            transform 0.3s cubic-bezier(0.04, 0.97, 0.84, 1.305),
            opacity 0.3s ease;
        transform: scale(1);
        opacity: 100%;
    }
    .get-result-leave-active {
        transform: scale(1);
        opacity: 100%;
    }
    .get-result-enter-from,
    .get-result-leave-to {
        backface-visibility: hidden;
        transform: scale(0);
        opacity: 0;
    }

    .drawer-expand-enter-active {
        transition:
            opacity 0.2s linear,
            max-height 0.3s ease;
        max-height: 10rem;
    }
    .drawer-expand-leave-active {
        transition:
            opacity 0.2s linear 0.1s,
            max-height 0.3s ease;
        max-height: 10rem;
    }

    .drawer-expand-enter-from,
    .drawer-expand-leave-to {
        opacity: 0;
        max-height: 0;
    }

    .fast-fade-enter-active,
    .fast-fade-leave-active {
        transition: opacity 0.1s ease;
        opacity: 100%;
    }

    .fast-fade-enter-from,
    .fast-fade-leave-to {
        opacity: 0;
    }
}
</style>

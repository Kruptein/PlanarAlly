<script setup lang="ts">
import { rollString, SYSTEMS } from "@planarally/dice";
import { DxConfig, DxSegmentType, type DxSegment } from "@planarally/dice/systems/dx";
import { computed, ref, watch } from "vue";

import type { DiceRollResult } from "../../../apiTypes";
import ClickGroup from "../../../core/components/ClickGroup.vue";
import { arrToToggleGroup } from "../../../core/components/toggleGroup";
import ToggleGroup from "../../../core/components/ToggleGroup.vue";
import { coreStore } from "../../../store/core";
import { sendDiceRollResult } from "../../api/emits/dice";
import { DxHelper } from "../../dice/dx";
// import { diceStore } from "../../dice/state";
// import { diceTool } from "../../tools/variants/dice";

// const button = ref<HTMLButtonElement | null>(null);
// const historyDiv = ref<HTMLDivElement | null>(null);

// Dice logic
// const diceArray = ref<{ die: number; amount: number }[]>([]);
// let timeout: number | undefined;

// const { DxSystem } = systems.dx;

const { DX } = await SYSTEMS.DX();

// const dxSystem = new DxSystem();

const _3dOptions = ["yes", "no"] as const;
const use3d = ref<(typeof _3dOptions)[number]>("no");
const shareResultOptions = ["All", "DM", "None"] as const;
const shareResult = ref<(typeof shareResultOptions)[number]>("All");

// const addOptions = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"] as const;
// const limitOperatorOptions = ["keep", "drop", "min", "max"] as const;
// const rerollOperatorOptions = ["inf", "once", "add", "explode"] as const;
// type operatorOptions = (typeof limitOperatorOptions)[number] | (typeof rerollOperatorOptions)[number];
// const selectorOptions = ["=", ">", "<", "highest", "lowest"] as const;
const literalOptions = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;
// const symbolOptions = ["+", "-"] as const; // , "*", "/", "(", ")"] as const;

// interface DieSegment {
//     type: DxSegmentType.Die;
//     die: (typeof addOptions)[number];
//     amount: number;
//     operator?: operatorOptions;
//     selector?: (typeof selectorOptions)[number];
//     selectorValue?: number;
// }
// interface ResolvedDieSegment {
//     rolls: { number: number; status?: "kept" | "dropped" }[];
//     total: number;
// }
// interface OperatorSegment {
//     type: DxSegmentType.Operator;
//     value: (typeof symbolOptions)[number];
// }
// interface LiteralSegment {
//     type: DxSegmentType.Literal;
//     value: number;
// }
// type Segment = DieSegment | LiteralSegment | OperatorSegment;

// type Results<T> = T extends { type: DxSegmentType.Literal }
//     ? { type: T["type"]; input: T; output: number }
//     : T extends { type: DxSegmentType.Operator }
//       ? { type: T["type"]; input: T; output: OperatorSegment["value"] }
//       : T extends { type: DxSegmentType.Die }
//         ? { type: T["type"]; input: T; output: ResolvedDieSegment }
//         : never;

const input = ref<DxSegment[]>([]);
const lastSeg = computed(() => input.value.at(-1));
const lastOutput = ref<string | null>(null);
// const lastResolved = ref<Results<Segment>[] | null>(null);
const lastResolved = ref<string>("");

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
watch(input, (parts) => (inputText.value = DxHelper.stringifySegments(parts)), { deep: true });

// const inputText = computed(() => {
//     let value = "";
//     for (const seg of input.value) {
//         if (seg.type === SegmentType.Die) {
//             value += `${seg.amount}${seg.die}`;
//             if (seg.operator === "keep") value += "k";
//             else if (seg.operator === "drop") value += "p";
//             else if (seg.operator === "explode") value += "e";
//             else if (seg.operator === "min") value += "mi";
//             else if (seg.operator === "max") value += "ma";
//             else if (seg.operator === "inf") value += "rr";
//             else if (seg.operator === "add") value += "ra";
//             else if (seg.operator === "once") value += "ro";
//             if (seg.selector === "highest") value += "h";
//             else if (seg.selector === "lowest") value += "l";
//             else if (seg.selector !== undefined) value += seg.selector;
//             if (seg.selectorValue !== undefined) value += seg.selectorValue;
//         }
//         if (seg.type === SegmentType.Operator) value += ` ${seg.value} `;
//         if (seg.type === SegmentType.Literal) value += seg.value;
//     }
//     return value;
// });

function clear(): void {
    input.value = [];
    lastOutput.value = null;
    lastResolved.value = "";
}

// function updateSegments(text: string): void {
//     const data: Segment[] = [];
//     /*
//     (?:^|(?<op>[+-]))\s*                      // Operator
//     (?:
//         (?<dice>
//             (?<numDice>\d+)d(?<diceSize>\d+)  // XdY
//         )
//         (?:
//             (?:                               // Start of optional modifiers
//                 (?:
//                     (?<selMod>              // Modifiers that can use selectors
//                         [kpe]
//                         |
//                         (?:r[aor])
//                     )
//                     (?<selector>[hl<>])?      // selectors
//                 )
//                 |
//                 (?<nselModifier>m[ai])                     // modifiers that only work on literal values
//             )
//             (?<selval>\d+)                    // literal value for modifier
//         )?
//         |
//         (?<fixed>\d+)                         // literal value instead of XdY
//     )
//     */
//     const regex =
//         /(?:^|(?<op>[+-]))\s*(?:(?<dice>(?<numDice>\d+)d(?<diceSize>\d+))(?:(?:(?:(?<selMod>[kpe]|(?:r[aor]))(?<selector>[hl<>])?)|(?<nselMod>m[ai]))(?<selval>\d+))?|(?<fixed>\d+))/g;
//     for (const part of text.matchAll(regex)) {
//         if (part.groups?.op !== undefined) {
//             data.push({ type: SegmentType.Operator, value: part.groups.op as OperatorSegment["value"] });
//         }
//         if (part.groups?.fixed !== undefined) {
//             data.push({ type: SegmentType.Literal, value: Number.parseInt(part.groups.fixed) });
//         } else if (part.groups?.dice !== undefined) {
//             let operator: DieSegment["operator"];
//             if (part.groups.selMod !== undefined) {
//                 const m = part.groups.selMod;
//                 if (m === "k") operator = "keep";
//                 else if (m === "p") operator = "drop";
//                 else if (m === "rr") operator = "inf";
//                 else if (m === "ro") operator = "once";
//                 else if (m === "ra") operator = "add";
//                 else if (m === "e") operator = "explode";
//             } else if (part.groups?.nselMod !== undefined) {
//                 const m = part.groups.nselMod;
//                 if (m === "mi") operator = "min";
//                 else if (m === "ma") operator = "max";
//             }
//             let selector: DieSegment["selector"];
//             if (part.groups.selector !== undefined) {
//                 const s = part.groups.selector;
//                 if (s === ">") selector = ">";
//                 else if (s === "<") selector = "<";
//                 else if (s === "h") selector = "highest";
//                 else if (s === "l") selector = "lowest";
//             }
//             data.push({
//                 type: SegmentType.Die,
//                 die: `d${part.groups.diceSize!}` as DieSegment["die"],
//                 amount: Number.parseInt(part.groups.numDice!),
//                 operator,
//                 selector,
//                 selectorValue: part.groups.selval !== undefined ? Number.parseInt(part.groups.selval) : undefined,
//             });
//         }
//     }
//     input.value = data;
// }

// watch(
//     () => diceTool.state.history.length,
//     async () => {
//         await nextTick(() => {
//             historyDiv.value!.scrollTop = historyDiv.value!.scrollHeight;
//         });
//     },
// );

// function add(die: number): void {
//     if (diceTool.state.autoRoll) {
//         button.value?.classList.remove("transition");
//         button.value!.clientWidth; // force reflow
//         button.value?.classList.add("transition");

//         clearTimeout(timeout);
//         timeout = window.setTimeout(() => void go(), 1000);
//     }
//     const d = diceArray.value.find((d) => d.die === die);
//     if (d === undefined) {
//         diceArray.value.push({ die, amount: 1 });
//     } else {
//         d.amount++;
//     }
// }

// const diceText = computed(() => {
//     let text = "";
//     for (const [i, d] of diceArray.value.entries()) {
//         text += `${d.amount}d${d.die}`;
//         if (i < diceArray.value.length - 1) {
//             text += " + ";
//         }
//     }
//     return text;
// });

// async function reroll(roll: string): Promise<void> {
//     const key = await diceTool.roll(roll);
//     const result = diceStore.getTotal(key);
//     diceTool.state.history.push({ roll, result, player: coreStore.state.username });
//     sendDiceRollResult({
//         player: coreStore.state.username,
//         roll,
//         result,
//         shareWithAll: diceTool.state.shareWithAll,
//     });
// }

// async function go(): Promise<void> {
//     clearTimeout(timeout);
//     button.value?.classList.remove("transition");
//     const roll = diceText.value;
//     const key = await diceTool.roll(roll);
//     const result = diceStore.getTotal(key);
//     diceTool.state.history.push({ roll, result, player: coreStore.state.username });
//     sendDiceRollResult({
//         player: coreStore.state.username,
//         roll,
//         result,
//         shareWithAll: diceTool.state.shareWithAll,
//     });
//     diceArray.value = [];
// }

// function addSegment(seg: Segment): void {
//     const lastSeg = input.value?.at(-1);
//     if (lastSeg !== undefined && lastSeg.type !== SegmentType.Operator)
//         input.value.push({ type: SegmentType.Operator, value: "+" });
//     input.value.push(seg);
// }

function addDie(die: (typeof DxConfig.addOptions)[number]): void {
    DxHelper.addDie(input, die);
}

// function addDie(die: (typeof addOptions)[number]): void {
//     const seg = lastSeg.value;
//     if (seg?.type === SegmentType.Die && seg.die === die) {
//         seg.amount += 1;
//     } else if (seg?.type === SegmentType.Literal) {
//         input.value.pop();
//         input.value.push({ type: SegmentType.Die, amount: seg.value, die });
//     } else {
//         addSegment({ type: SegmentType.Die, amount: 1, die });
//     }
// }

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
    const value = Number.parseInt(literal);
    DxHelper.addLiteral(input, value);
}

// function addLiteral(literal: (typeof literalOptions)[number]): void {
//     const value = Number.parseInt(literal);
//     const seg = lastSeg.value;
//     if (seg?.type === DxSegmentType.Die && seg.operator !== undefined && seg.selectorValue === undefined) {
//         seg.selectorValue = value;
//     } else {
//         addSegment({ type: DxSegmentType.Literal, value });
//     }
// }

function addSymbol(symbol: (typeof DxConfig.symbolOptions)[number]): void {
    input.value.push({ type: DxSegmentType.Operator, value: symbol });
}

async function roll(): Promise<void> {
    lastOutput.value = null;
    // lastResolved.value = null;

    const result = await rollString(inputText.value, DX);

    lastOutput.value = result.endResult;
    lastResolved.value = result.description;

    if (shareResult.value !== "None") {
        sendDiceRollResult({
            player: coreStore.state.username,
            roll: inputText.value,
            result: result.endResult,
            shareWith: shareResult.value.toLowerCase() as DiceRollResult["shareWith"],
        });
    }
}

// async function evaluateDie(segment: DieSegment): Promise<ResolvedDieSegment> {
//     const rolls: ResolvedDieSegment["rolls"] = [];
//     // First resolve all normal rolls + rerolls
//     const results = await rollDie(segment.die, segment.amount);
//     for (let result of (results[0]!.details[0]! as ResolvedDicePart).output) {
//         if (segment.operator === "min" && result < segment.selectorValue!) result = segment.selectorValue!;
//         if (segment.operator === "max" && result > segment.selectorValue!) result = segment.selectorValue!;
//         rolls.push({ number: result });
//     }
//     let total = 0;
//     // Then resolve all selectors
//     for (const [i, roll] of rolls.entries()) {
//         if (segment.operator === "keep" || segment.operator === "drop") {
//             if (selects(i, rolls, segment)) {
//                 roll.status = segment.operator === "keep" ? "kept" : "dropped";
//                 if (segment.operator === "keep") total += roll.number;
//             } else if (segment.operator === "drop") total += roll.number;
//         } else {
//             total += roll.number;
//         }
//     }
//     return { total, rolls };
// }

// async function rollDie(die: (typeof addOptions)[number], amount: number): Promise<DndResult[]> {
//     const input = `${amount}${die}`;
//     if (use3d.value === "yes") {
//         const key = await diceTool.roll(input);
//         return diceStore.getResults(key);
//     } else {
//         const result: DndResult = { total: 0, details: [] };
//         result.details.push({ type: "dice", input, output: [] });
//         for (let i = 0; i < amount; i++) {
//             const roll = Math.round(randomInterval(1, Number.parseInt(die.slice(1))));
//             result.total += roll;
//             (result.details[0]! as ResolvedDicePart).output.push(roll);
//         }
//         return [result];
//     }
// }

// function selects(index: number, rolls: ResolvedDieSegment["rolls"], segment: DieSegment): boolean {
//     const value = rolls[index]!.number;
//     if (segment.selector === undefined) return false;
//     if (segment.selector === "=" || segment.selectorValue === undefined) return value === segment.selectorValue;
//     else if (segment.selector === "<") return value < segment.selectorValue;
//     else if (segment.selector === ">") return value > segment.selectorValue;
//     else if (segment.selector === "highest")
//         return [...rolls.entries()]
//             .sort((a, b) => b[1].number - a[1].number)
//             .slice(0, segment.selectorValue)
//             .some(([i]) => i === index);
//     else if (segment.selector === "lowest")
//         return [...rolls.entries()]
//             .sort((a, b) => a[1].number - b[1].number)
//             .slice(0, segment.selectorValue)
//             .some(([i]) => i === index);
//     return false;
// }

// function repr(resolved: Results<Segment>[]): string {
//     let text = "";
//     for (const segment of resolved) {
//         if (text.length) text += " ";
//         if (segment.type === DxSegmentType.Literal) text += segment.output.toString();
//         if (segment.type === DxSegmentType.Operator) text += segment.output;
//         if (segment.type === DxSegmentType.Die) {
//             const { rolls, total } = segment.output;
//             if (rolls.length === 1) text += total.toString();
//             if (rolls.length > 1) {
//                 text += `${total.toString()} [${rolls.map((r) => r.number).join(", ")}]`;
//             }
//         }
//     }
//     return text;
// }
</script>

<template>
    <div id="dice" class="tool-detail">
        <div class="header">\\ SETTINGS \\</div>
        <div id="dice-settings" class="dice-grid">
            <label>Use 3D dice</label>
            <ToggleGroup v-model="use3d" :options="arrToToggleGroup(_3dOptions)" :multi-select="false" />
            <label>Share result with</label>
            <ToggleGroup v-model="shareResult" :options="arrToToggleGroup(shareResultOptions)" :multi-select="false" />
        </div>
        <div class="header">
            <span>\\ CONFIGURE \\</span>
            <label id="toggle-advanced" for="advanced-configure-toggle">Toggle Advanced</label>
        </div>
        <div id="configure-settings" class="dice-grid">
            <label>Add</label>
            <ClickGroup :options="DxConfig.addOptions" :disabled="showSelector" @click="addDie" />
            <div id="advanced-config">
                <label>Operators: limit</label>
                <ClickGroup :options="DxConfig.limitOperatorOptions" :disabled="!showOperator" @click="addOperator" />
                <!--<label>Operators: reroll</label>
                        <ClickGroup :options="rerollOperatorOptions" :disabled="!showOperator" @click="addOperator" />-->
                <label>Selectors</label>
                <ClickGroup :options="DxConfig.selectorOptions" :disabled="!showSelector" @click="addSelector" />
            </div>
            <input id="advanced-configure-toggle" type="checkbox" />
            <label>Numbers</label>
            <ClickGroup :options="literalOptions" @click="addLiteral" />
            <label>Symbols</label>
            <ClickGroup :options="DxConfig.symbolOptions" :disabled="showSelector" @click="addSymbol" />
        </div>
        <input id="input" type="text" :value="inputText" @keyup.enter="roll" />
        <div id="buttons">
            <font-awesome-icon icon="clock-rotate-left" @click="clear" />
            <div style="flex-grow: 1"></div>
            <div v-show="lastOutput" style="margin-right: 0.5rem">= {{ lastOutput }}</div>
            <div v-if="lastResolved">({{ lastResolved }})</div>
            <button :disabled="input.length === 0" @click="clear">Clear</button>
            <button :disabled="input.length === 0" @click="roll">Roll!</button>
        </div>
    </div>
</template>

<style scoped lang="scss">
#advanced-config {
    display: none;

    &:has(~ #advanced-configure-toggle:checked) {
        display: contents;
    }
}

#advanced-configure-toggle {
    display: none;

    + label {
        &:hover {
            cursor: pointer;
            font-weight: bold;
        }
    }
}

#dice {
    display: flex;
    flex-direction: column;
    min-width: 10rem;
    min-height: 10rem;

    .header {
        display: flex;
        justify-content: space-between;

        margin: 0;
        padding: 0.5rem 1rem;

        border-radius: 1rem;

        font-weight: bold;
    }

    .dice-grid {
        margin-bottom: 1rem;

        display: grid;
        grid-template-columns: 1fr auto;
        column-gap: 2rem;
        row-gap: 0.5rem;

        align-items: center;

        .toggle-group,
        .click-group {
            justify-self: flex-end;
        }
    }

    #configure-settings {
        row-gap: 0.25rem;

        user-select: none;
    }

    #toggle-advanced {
        font-weight: normal;
        font-style: italic;

        &:hover {
            cursor: pointer;
        }
    }

    #input {
        padding: 0.5rem 1rem;
    }

    #buttons {
        margin-top: 0.5rem;
        display: flex;
        justify-content: flex-end;
        align-items: center;

        > button {
            margin-left: 0.5rem;
            padding: 0.25rem 0.5rem;
        }
    }
}
</style>

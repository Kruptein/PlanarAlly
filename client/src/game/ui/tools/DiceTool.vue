<script setup lang="ts">
import { computed, ref } from "vue";

import ClickGroup from "../../../core/components/ClickGroup.vue";
import { arrToToggleGroup } from "../../../core/components/toggleGroup";
import ToggleGroup from "../../../core/components/ToggleGroup.vue";
import { randomInterval } from "../../../core/utils";
import { diceStore } from "../../dice/state";
import { diceTool } from "../../tools/variants/dice";
// import { coreStore } from "../../../store/core";
// import { sendDiceRollResult } from "../../api/emits/dice";
// import { diceStore } from "../../dice/state";
// import { diceTool } from "../../tools/variants/dice";

// const button = ref<HTMLButtonElement | null>(null);
// const historyDiv = ref<HTMLDivElement | null>(null);

// Dice logic
// const diceArray = ref<{ die: number; amount: number }[]>([]);
// let timeout: number | undefined;

const activeTab = ref(0);

const _3dOptions = ["yes", "no"] as const;
const use3d = ref<(typeof _3dOptions)[number]>("no");
const shareResultOptions = ["All", "DM", "None"] as const;
const shareResult = ref<(typeof shareResultOptions)[number]>("All");

const addOptions = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"] as const;
const limitOperatorOptions = ["keep", "drop", "min", "max"] as const;
const rerollOperatorOptions = ["inf", "once", "add", "explode"] as const;
type operatorOptions = (typeof limitOperatorOptions)[number] | (typeof rerollOperatorOptions)[number];
const selectorOptions = ["=", ">", "<", "highest", "lowest"] as const;
const literalOptions = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;
const symbolOptions = ["+", "-"] as const; // , "*", "/", "(", ")"] as const;

enum SegmentType {
    Die,
    Literal,
    Operator,
}

interface DieSegment {
    type: SegmentType.Die;
    die: (typeof addOptions)[number];
    amount: number;
    operator?: operatorOptions;
    selector?: (typeof selectorOptions)[number];
    selectorValue?: number;
}
interface ResolvedDieSegment {
    rolls: { number: number; status?: "kept" | "dropped" }[];
    total: number;
}
interface OperatorSegment {
    type: SegmentType.Operator;
    value: (typeof symbolOptions)[number];
}
interface LiteralSegment {
    type: SegmentType.Literal;
    value: number;
}
type Segment = DieSegment | LiteralSegment | OperatorSegment;

type Results<T> = T extends { type: SegmentType.Literal }
    ? { type: T["type"]; input: T; output: number }
    : T extends { type: SegmentType.Operator }
      ? { type: T["type"]; input: T; output: OperatorSegment["value"] }
      : T extends { type: SegmentType.Die }
        ? { type: T["type"]; input: T; output: ResolvedDieSegment }
        : never;

const input = ref<Segment[]>([]);
const lastSeg = computed(() => input.value.at(-1));
const lastOutput = ref<number | null>(null);
const lastResolved = ref<Results<Segment>[] | null>(null);

const showOperator = computed(() => {
    const seg = lastSeg.value;
    return seg?.type === SegmentType.Die && seg.selector === undefined && seg.selectorValue === undefined;
});

const showSelector = computed(() => {
    const seg = lastSeg.value;
    return (
        seg?.type === SegmentType.Die &&
        seg.operator !== undefined &&
        seg.operator !== "min" &&
        seg.operator !== "max" &&
        seg.selectorValue === undefined &&
        seg.selector === undefined
    );
});

const inputText = computed(() => {
    let value = "";
    for (const seg of input.value) {
        if (seg.type === SegmentType.Die) {
            value += `${seg.amount}${seg.die}`;
            if (seg.operator === "keep") value += "k";
            else if (seg.operator === "drop") value += "p";
            else if (seg.operator === "explode") value += "e";
            else if (seg.operator === "min") value += "mi";
            else if (seg.operator === "max") value += "ma";
            else if (seg.operator === "inf") value += "rr";
            else if (seg.operator === "add") value += "ra";
            else if (seg.operator === "once") value += "ro";
            if (seg.selector === "highest") value += "h";
            else if (seg.selector === "lowest") value += "l";
            else if (seg.selector !== undefined) value += seg.selector;
            if (seg.selectorValue !== undefined) value += seg.selectorValue;
        }
        if (seg.type === SegmentType.Operator) value += ` ${seg.value} `;
        if (seg.type === SegmentType.Literal) value += seg.value;
    }
    return value;
});

function clear(): void {
    input.value = [];
    lastOutput.value = null;
}

function updateSegments(text: string): void {
    const data: Segment[] = [];
    /*
    (?:^|(?<op>[+-]))\s*                      // Operator
    (?:
        (?<dice>
            (?<numDice>\d+)d(?<diceSize>\d+)  // XdY
        )
        (?:
            (?:                               // Start of optional modifiers
                (?:
                    (?<selMod>              // Modifiers that can use selectors
                        [kpe]
                        |
                        (?:r[aor])
                    )
                    (?<selector>[hl<>])?      // selectors
                )
                |
                (?<nselModifier>m[ai])                     // modifiers that only work on literal values
            )
            (?<selval>\d+)                    // literal value for modifier
        )?
        |
        (?<fixed>\d+)                         // literal value instead of XdY
    )
    */
    const regex =
        /(?:^|(?<op>[+-]))\s*(?:(?<dice>(?<numDice>\d+)d(?<diceSize>\d+))(?:(?:(?:(?<selMod>[kpe]|(?:r[aor]))(?<selector>[hl<>])?)|(?<nselMod>m[ai]))(?<selval>\d+))?|(?<fixed>\d+))/g;
    for (const part of text.matchAll(regex)) {
        if (part.groups?.op !== undefined) {
            data.push({ type: SegmentType.Operator, value: part.groups.op as OperatorSegment["value"] });
        }
        if (part.groups?.fixed !== undefined) {
            data.push({ type: SegmentType.Literal, value: Number.parseInt(part.groups.fixed) });
        } else if (part.groups?.dice !== undefined) {
            let operator: DieSegment["operator"];
            if (part.groups.selMod !== undefined) {
                const m = part.groups.selMod;
                if (m === "k") operator = "keep";
                else if (m === "p") operator = "drop";
                else if (m === "rr") operator = "inf";
                else if (m === "ro") operator = "once";
                else if (m === "ra") operator = "add";
                else if (m === "e") operator = "explode";
            } else if (part.groups?.nselMod !== undefined) {
                const m = part.groups.nselMod;
                if (m === "mi") operator = "min";
                else if (m === "ma") operator = "max";
            }
            let selector: DieSegment["selector"];
            if (part.groups.selector !== undefined) {
                const s = part.groups.selector;
                if (s === ">") selector = ">";
                else if (s === "<") selector = "<";
                else if (s === "h") selector = "highest";
                else if (s === "l") selector = "lowest";
            }
            data.push({
                type: SegmentType.Die,
                die: `d${part.groups.diceSize!}` as DieSegment["die"],
                amount: Number.parseInt(part.groups.numDice!),
                operator,
                selector,
                selectorValue: part.groups.selval !== undefined ? Number.parseInt(part.groups.selval) : undefined,
            });
        }
    }
    input.value = data;
}

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

function addSegment(seg: Segment): void {
    const lastSeg = input.value?.at(-1);
    if (lastSeg !== undefined && lastSeg.type !== SegmentType.Operator)
        input.value.push({ type: SegmentType.Operator, value: "+" });
    input.value.push(seg);
}

function addDie(die: (typeof addOptions)[number]): void {
    const seg = lastSeg.value;
    if (seg?.type === SegmentType.Die && seg.die === die) {
        seg.amount += 1;
    } else if (seg?.type === SegmentType.Literal) {
        input.value.pop();
        input.value.push({ type: SegmentType.Die, amount: seg.value, die });
    } else {
        addSegment({ type: SegmentType.Die, amount: 1, die });
    }
}

function addOperator(operator: operatorOptions): void {
    const seg = lastSeg.value;
    if (seg?.type !== SegmentType.Die) return;
    seg.operator = operator;
}

function addSelector(selector: (typeof selectorOptions)[number]): void {
    const seg = lastSeg.value;
    if (seg?.type !== SegmentType.Die) return;
    seg.selector = selector;
}

function addLiteral(literal: (typeof literalOptions)[number]): void {
    const value = Number.parseInt(literal);
    const seg = lastSeg.value;
    if (seg?.type === SegmentType.Die && seg.operator !== undefined && seg.selectorValue === undefined) {
        seg.selectorValue = value;
    } else {
        addSegment({ type: SegmentType.Literal, value });
    }
}

function addSymbol(symbol: (typeof symbolOptions)[number]): void {
    input.value.push({ type: SegmentType.Operator, value: symbol });
}

async function roll(): Promise<void> {
    // if (use3d.value === "yes") {
    //     console.warn("3D roller currently unavailable");
    //     return;
    // }
    const resolved: Results<Segment>[] = [];
    let total = 0;
    let opMode: OperatorSegment["value"] = "+";
    for (const segment of input.value) {
        const { type } = segment;
        if (type === SegmentType.Literal) {
            total += segment.value * (opMode === "+" ? 1 : -1);
            resolved.push({ type, input: segment, output: segment.value } as Results<LiteralSegment>);
        } else if (type === SegmentType.Operator) {
            opMode = segment.value;
            resolved.push({ type, input: segment, output: segment.value } as Results<OperatorSegment>);
        } else if (type === SegmentType.Die) {
            const output = await evaluateDie(segment);
            total += output.total * (opMode === "+" ? 1 : -1);
            resolved.push({ type, input: segment, output } as Results<DieSegment>);
        }
    }
    console.log(resolved, total);
    lastOutput.value = total;
    lastResolved.value = resolved;

    if (shareResult.value !== "None") {
        sendDiceRollResult({
            player: coreStore.state.username,
            roll: inputText.value,
            result: total.toString(),
            shareWith: shareResult.value.toLowerCase() as DiceRollResult["shareWith"],
        });
    }
}

async function evaluateDie(segment: DieSegment): Promise<ResolvedDieSegment> {
    const rolls: ResolvedDieSegment["rolls"] = [];
    // First resolve all normal rolls + rerolls
    for (let die = 0; die < segment.amount; die++) {
        let result = await rollDie(segment.die);
        if (segment.operator === "min" && result < segment.selectorValue!) result = segment.selectorValue!;
        if (segment.operator === "max" && result > segment.selectorValue!) result = segment.selectorValue!;
        rolls.push({ number: result });
    }
    let total = 0;
    // Then resolve all selectors
    for (const [i, roll] of rolls.entries()) {
        if (segment.operator === "keep" || segment.operator === "drop") {
            if (selects(i, rolls, segment)) {
                roll.status = segment.operator === "keep" ? "kept" : "dropped";
                if (segment.operator === "keep") total += roll.number;
            } else if (segment.operator === "drop") total += roll.number;
        } else {
            total += roll.number;
        }
    }
    return { total, rolls };
}

async function rollDie(die: (typeof addOptions)[number]): Promise<number> {
    if (use3d.value === "yes") {
        const key = await diceTool.roll(`1${die}`);
        return diceStore.getTotal(key);
    } else {
        return Math.round(randomInterval(1, Number.parseInt(die.slice(1)))); // todo!!!!
    }
}

function selects(index: number, rolls: ResolvedDieSegment["rolls"], segment: DieSegment): boolean {
    const value = rolls[index]!.number;
    if (segment.selector === undefined) return false;
    if (segment.selector === "=" || segment.selectorValue === undefined) return value === segment.selectorValue;
    else if (segment.selector === "<") return value < segment.selectorValue;
    else if (segment.selector === ">") return value > segment.selectorValue;
    else if (segment.selector === "highest")
        return [...rolls.entries()]
            .sort((a, b) => b[1].number - a[1].number)
            .slice(0, segment.selectorValue)
            .some(([i]) => i === index);
    else if (segment.selector === "lowest")
        return [...rolls.entries()]
            .sort((a, b) => a[1].number - b[1].number)
            .slice(0, segment.selectorValue)
            .some(([i]) => i === index);
    return false;
}

function repr(resolved: Results<Segment>[]): string {
    let text = "";
    for (const segment of resolved) {
        if (text.length) text += " ";
        if (segment.type === SegmentType.Literal) text += segment.output.toString();
        if (segment.type === SegmentType.Operator) text += segment.output;
        if (segment.type === SegmentType.Die) {
            const { rolls, total } = segment.output;
            if (rolls.length === 1) text += total.toString();
            if (rolls.length > 1) {
                text += `${total.toString()} [${rolls.map((r) => r.number).join(", ")}]`;
            }
        }
    }
    return text;
}
</script>

<template>
    <div id="dice" class="tool-detail">
        <div id="dice-nav">
            <div :class="{ active: activeTab === 0 }" @click="activeTab = 0">NEW</div>
            <div :class="{ active: activeTab === 1 }" @click="activeTab = 1">HISTORY</div>
        </div>
        <template v-if="activeTab === 0">
            <div class="header">\\ SETTINGS \\</div>
            <div id="dice-settings" class="dice-grid">
                <label>Use 3D dice</label>
                <ToggleGroup v-model="use3d" :options="arrToToggleGroup(_3dOptions)" :multi-select="false" />
                <label>Share result with</label>
                <ToggleGroup
                    v-model="shareResult"
                    :options="arrToToggleGroup(shareResultOptions)"
                    :multi-select="false"
                />
            </div>
            <div class="header">
                <span>\\ CONFIGURE \\</span>
                <label id="toggle-advanced" for="advanced-configure-toggle">Toggle Advanced</label>
            </div>
            <div id="configure-settings" class="dice-grid">
                <label>Add</label>
                <ClickGroup :options="addOptions" :disabled="showSelector" @click="addDie" />
                <div id="advanced-config">
                    <label>Operators: limit</label>
                    <ClickGroup :options="limitOperatorOptions" :disabled="!showOperator" @click="addOperator" />
                    <!--<label>Operators: reroll</label>
                        <ClickGroup :options="rerollOperatorOptions" :disabled="!showOperator" @click="addOperator" />-->
                    <label>Selectors</label>
                    <ClickGroup :options="selectorOptions" :disabled="!showSelector" @click="addSelector" />
                </div>
                <input id="advanced-configure-toggle" type="checkbox" />
                <label>Numbers</label>
                <ClickGroup :options="literalOptions" @click="addLiteral" />
                <label>Symbols</label>
                <ClickGroup :options="symbolOptions" :disabled="showSelector" @click="addSymbol" />
            </div>
            <input
                id="input"
                type="text"
                :value="inputText"
                @change="updateSegments(($event.target as HTMLInputElement).value)"
                @keyup.enter="roll"
            />
            <div id="buttons">
                <font-awesome-icon icon="clock-rotate-left" @click="clear" />
                <div style="flex-grow: 1"></div>
                <div v-show="lastOutput" style="margin-right: 0.5rem">= {{ lastOutput }}</div>
                <div v-if="lastResolved">({{ repr(lastResolved) }})</div>
                <button :disabled="input.length === 0" @click="clear">Clear</button>
                <button :disabled="input.length === 0" @click="roll">Roll!</button>
            </div>
        </template>
        <template v-else>
            <div class="header">\\ HISTORY \\</div>
            <div id="dice-history" ref="historyDiv">WOOO</div>
        </template>
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

#dice-nav {
    position: absolute;
    top: -3.4rem;
    display: flex;
    flex-direction: row-reverse;
    align-items: end;
    transform-origin: 100% 100%;
    transform: rotate(-90deg);
    right: 100%;
    text-align: right;
    z-index: -1;

    > div {
        background-color: lightblue;
        padding: 0.35rem 0.75rem;
        // margin-right: 0.5rem;
        border: 1px solid black;
        transform: skew(-14deg);

        &.active {
            padding: 0.75rem;
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

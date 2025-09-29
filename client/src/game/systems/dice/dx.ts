import { type DxSegment, DxSegmentType } from "@planarally/dice/systems/dx";
import { ref, watch, type Ref } from "vue";

import { diceState } from "./state";

import { diceSystem } from ".";

const addOptions = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"] as const;
const symbolOptions = ["+", "-"] as const; // , "*", "/", "(", ")"] as const;

const parts = ref<DxSegment[]>([]);

watch(
    () => diceState.reactive.textInput,
    (text) => {
        parts.value = diceState.raw.systems!["2d"].parse(text);
    },
);

// We don't want to do this on every change, as that can remove pending text changes
// which will update parts using the watcher above
function syncToState(): void {
    diceSystem.setInput(stringifySegments());
}

function addSegment(partsRef: Ref<DxSegment[]>, segment: DxSegment): void {
    const parts = partsRef.value;
    if (parts.length > 0 && parts.at(-1)?.type !== DxSegmentType.Operator) {
        parts.push({ type: DxSegmentType.Operator, input: "+" });
    }
    parts.push(segment);
    syncToState();
}

function addDie(die: (typeof addOptions)[number]): void {
    const seg = parts.value.at(-1);
    if (seg?.type === DxSegmentType.Die && seg.die === die) {
        seg.amount += 1;
        seg.input = `${seg.amount}${die}`;
    } else if (seg?.type === DxSegmentType.Literal) {
        parts.value.pop();
        addSegment(parts, { type: DxSegmentType.Die, amount: seg.value, die, input: `${seg.value}${die}` });
    } else {
        addSegment(parts, { type: DxSegmentType.Die, amount: 1, die, input: `1${die}` });
    }
    syncToState();
}

function addLiteral(value: number): void {
    const seg = parts.value.at(-1);
    if (seg?.type === DxSegmentType.Die && seg.operator !== undefined) {
        if (seg.selectorValue === undefined) seg.selectorValue = value;
        else seg.selectorValue = seg.selectorValue * 10 + value;
    } else if (seg?.type === DxSegmentType.Literal) {
        seg.value = seg.value * 10 + value;
    } else {
        addSegment(parts, { type: DxSegmentType.Literal, input: value.toString(), value });
    }
    syncToState();
}

function addOperator(input: (typeof symbolOptions)[number]): void {
    addSegment(parts, { type: DxSegmentType.Operator, input });
    syncToState();
}

function stringifySegments(): string {
    let text = "";
    for (const seg of parts.value) {
        if (seg.type === DxSegmentType.Die) {
            text += `${seg.amount}${seg.die}`;
            if (seg.operator === "keep") text += "k";
            else if (seg.operator === "drop") text += "p";
            else if (seg.operator === "explode") text += "e";
            else if (seg.operator === "min") text += "mi";
            else if (seg.operator === "max") text += "ma";
            else if (seg.operator === "inf") text += "rr";
            else if (seg.operator === "add") text += "ra";
            else if (seg.operator === "once") text += "ro";

            if (seg.selector === "highest") text += "h";
            else if (seg.selector === "lowest") text += "l";
            else if (seg.selector !== undefined) text += seg.selector;
            if (seg.selectorValue !== undefined) text += seg.selectorValue;
        }
        if (seg.type === DxSegmentType.Operator) text += ` ${seg.input} `;
        if (seg.type === DxSegmentType.Literal) text += seg.value;
    }
    return text;
}

export const DxHelper = {
    addDie,
    addLiteral,
    addOperator,
    parts,
};

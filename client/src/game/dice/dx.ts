import { type DxSegment, DxSegmentType } from "@planarally/dice/systems/dx";
import type { Ref } from "vue";

const addOptions = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"] as const;
const symbolOptions = ["+", "-"] as const; // , "*", "/", "(", ")"] as const;

function addSegment(partsRef: Ref<DxSegment[]>, segment: DxSegment): void {
    const parts = partsRef.value;
    if (parts.length > 0 && parts.at(-1)?.type !== DxSegmentType.Operator) {
        parts.push({ type: DxSegmentType.Operator, value: "+" });
    }
    parts.push(segment);
}

function addDie(parts: Ref<DxSegment[]>, die: (typeof addOptions)[number]): void {
    const seg = parts.value.at(-1);
    if (seg?.type === DxSegmentType.Die && seg.die === die) {
        seg.amount += 1;
    } else if (seg?.type === DxSegmentType.Literal) {
        parts.value.pop();
        addSegment(parts, { type: DxSegmentType.Die, amount: seg.value, die });
    } else {
        addSegment(parts, { type: DxSegmentType.Die, amount: 1, die });
    }
}

function addLiteral(parts: Ref<DxSegment[]>, value: number): void {
    const seg = parts.value.at(-1);
    if (seg?.type === DxSegmentType.Die && seg.operator !== undefined) {
        if (seg.selectorValue === undefined) seg.selectorValue = value;
        else seg.selectorValue = seg.selectorValue * 10 + value;
    } else if (seg?.type === DxSegmentType.Literal) {
        seg.value = seg.value * 10 + value;
    } else {
        addSegment(parts, { type: DxSegmentType.Literal, value });
    }
}

function addOperator(parts: Ref<DxSegment[]>, value: (typeof symbolOptions)[number]): void {
    addSegment(parts, { type: DxSegmentType.Operator, value });
}

function stringifySegments(parts: DxSegment[]): string {
    let text = "";
    for (const seg of parts) {
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
        if (seg.type === DxSegmentType.Operator) text += ` ${seg.value} `;
        if (seg.type === DxSegmentType.Literal) text += seg.value;
    }
    return text;
}

export const DxHelper = {
    addDie,
    addLiteral,
    addOperator,
    stringifySegments,
};

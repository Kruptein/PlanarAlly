import { computed, type ComputedRef } from "vue";

import { customDataState } from "./state";
import { type UiShapeCustomData } from "./types";

type VariableSegment =
    | { text: string; isVariable: false }
    | { text: string; isVariable: true; ref: ComputedRef<UiShapeCustomData | undefined> };

export function getVariableSegments(data: string): VariableSegment[] {
    const result: VariableSegment[] = [];
    for (const part of data.split(" ")) {
        const m = part.match(/{([\w/]+)}/);
        const prev = result.at(-1);
        if (m === null) {
            if (prev !== undefined && !prev.isVariable) {
                prev.text += ` ${part}`;
            } else {
                result.push({ text: part, isVariable: false });
            }
        } else {
            if (m[1] === undefined) continue;
            const parts = m[1].split("/");
            if (parts.length === 0) continue;
            const last = parts.at(-1)!;
            let prefix = parts.length === 1 ? undefined : parts.slice(0, -1).join("/");
            if (prefix !== undefined && prefix[0] !== "/") prefix = `/${prefix}`;
            result.push({
                text: last,
                isVariable: true,
                ref: computed(() =>
                    customDataState.mutableReactive.data.find(
                        (data) => (prefix === undefined || data.prefix === prefix) && data.name === last,
                    ),
                ),
            });
        }
    }
    return result;
}

export function convertVariables(data: string): string {
    const segments = getVariableSegments(data);
    return segments
        .filter((segment) => !segment.isVariable || segment.ref.value !== undefined)
        .map((segment) => (segment.isVariable ? segment.ref.value!.value : segment.text))
        .join(" ");
}

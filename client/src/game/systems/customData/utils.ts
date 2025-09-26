import { computed, type ComputedRef } from "vue";

import { customDataState } from "./state";
import { type UiShapeCustomData } from "./types";

const CUSTOM_DATA_VALID_CHARS = "\\w /";
const CUSTOM_DATA_REGEX = /{([\w /]+)}/g; // keep in sync with the above (reads nicer as /../ compared to RegExp)

type VariableSegment =
    | { text: string; isVariable: false }
    | { text: string; isVariable: true; ref: ComputedRef<UiShapeCustomData | undefined> };

export function getCustomDataReference(name: string): string {
    return name.replaceAll(new RegExp(`[^${CUSTOM_DATA_VALID_CHARS}]`, "g"), "");
}

export function getVariableSegments(data: string): VariableSegment[] {
    const result: VariableSegment[] = [];
    let nextIndex = 0;
    for (const part of data.matchAll(CUSTOM_DATA_REGEX)) {
        if (nextIndex < part.index) {
            result.push({ text: data.slice(nextIndex, part.index), isVariable: false });
            nextIndex = part.index;
        }
        const match = part[1]!;
        const parts = match.split("/");
        if (parts.length === 0) continue;
        const last = parts.at(-1)!;
        let prefix = parts.length === 1 ? undefined : parts.slice(0, -1).join("/");
        if (prefix !== undefined && prefix[0] !== "/") prefix = `/${prefix}`;
        result.push({
            text: last,
            isVariable: true,
            ref: computed(() =>
                customDataState.mutableReactive.data.find(
                    (data) =>
                        (prefix === undefined ||
                            getCustomDataReference(data.prefix.toLowerCase()) === prefix.toLowerCase()) &&
                        (data.reference?.toLowerCase() ?? getCustomDataReference(data.name.toLowerCase())) ===
                            last.toLowerCase(),
                ),
            ),
        });
        nextIndex = part.index + match.length + 2; // the { and }
    }
    // no matches at all
    if (result.length === 0) {
        result.push({ text: data, isVariable: false });
    } else if (nextIndex < data.length) {
        result.push({ text: data.slice(nextIndex), isVariable: false });
    }
    return result;
}

export function convertVariables(data: string): string {
    const segments = getVariableSegments(data);
    return segments
        .filter((segment) => !segment.isVariable || segment.ref.value !== undefined)
        .map((segment) => {
            if (!segment.isVariable) return segment.text;
            const ref = segment.ref.value!;
            if (ref.kind === "dice-expression") return convertVariables(ref.value);
            return ref.value;
        })
        .join(" ");
}

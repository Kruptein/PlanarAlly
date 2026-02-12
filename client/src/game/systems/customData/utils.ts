import type { LocalId } from "../../../core/id";
import { selectedState } from "../selected/state";

import { customDataState } from "./state";
import { type UiShapeCustomData } from "./types";

const CUSTOM_DATA_VALID_CHARS = "\\w /";
// This should mostly be kept in sync with the above (reads nicer as /../ compared to RegExp)
// The first part of the full regex is an optional shape LocalId discriminator
// This can only be used in dice tool input for now, we might have to change this to a part of the GlobalId
// if we want to store this in the db
const CUSTOM_DATA_REGEX = /{(\[\d+\])?([\w /]+)}/g;

type VariableSegment =
    | { text: string; isVariable: false }
    | { text: string; isVariable: true; ref: UiShapeCustomData | undefined; discriminator?: string };

export function getCustomDataReference(name: string): string {
    return name.replaceAll(new RegExp(`[^${CUSTOM_DATA_VALID_CHARS}]`, "g"), "");
}

export function getVariableSegments(data: string, shapeFocus?: LocalId): VariableSegment[] {
    const result: VariableSegment[] = [];
    let nextIndex = 0;
    for (const part of data.matchAll(CUSTOM_DATA_REGEX)) {
        if (nextIndex < part.index) {
            result.push({ text: data.slice(nextIndex, part.index), isVariable: false });
            nextIndex = part.index;
        }
        const shapeMatch = part[1];
        const shapeId = shapeMatch !== undefined ? (Number.parseInt(shapeMatch.slice(1, -1)) as LocalId) : undefined;
        const refMatch = part[2]!;
        const parts = refMatch.split("/");
        if (parts.length === 0) continue;
        const last = parts.at(-1)!;
        let prefix = parts.length === 1 ? undefined : parts.slice(0, -1).join("/");
        if (prefix !== undefined && prefix[0] !== "/") prefix = `/${prefix}`;
        result.push({
            text: last,
            isVariable: true,
            discriminator: shapeMatch ?? shapeFocus?.toString(),
            ref: customDataState.readonly.data
                .get(shapeId ?? shapeFocus ?? selectedState.reactive.focus!)
                ?.find(
                    (data) =>
                        (prefix === undefined ||
                            getCustomDataReference(data.prefix.toLowerCase()) === prefix.toLowerCase()) &&
                        (data.reference?.toLowerCase() ?? getCustomDataReference(data.name.toLowerCase())) ===
                            last.toLowerCase(),
                ),
        });
        nextIndex = part.index + (shapeMatch?.length ?? 0) + refMatch.length + 2; // the { and }
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
        .filter((segment) => !segment.isVariable || segment.ref !== undefined)
        .map((segment) => {
            if (!segment.isVariable) return segment.text;
            const ref = segment.ref!;
            if (ref.kind === "dice-expression") return convertVariables(ref.value);
            return ref.value;
        })
        .join(" ");
}

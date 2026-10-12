import type { LocalId } from "../../../core/id";
import { i18n } from "../../../i18n";
import { getLocalId } from "../../id";
import { selectedState } from "../selected/state";

import { customDataState } from "./state";
import { type ElementId, type UiShapeCustomData } from "./types";

const CUSTOM_DATA_VALID_CHARS = "\\w /";
// This should mostly be kept in sync with the above (reads nicer as /../ compared to RegExp)
// The first part of the full regex is an optional shape LocalId discriminator
// This can only be used in dice tool input for now, we might have to change this to a part of the GlobalId
// if we want to store this in the db
const CUSTOM_DATA_REGEX = /{(\[\d+\])?([\w /]+)}/g;

type VariableSegment =
    | { text: string; isVariable: false }
    | { text: string; isVariable: true; raw: string; ref: UiShapeCustomData | undefined; discriminator?: string };

export function getCustomDataReference(name: string): string {
    return name.replaceAll(new RegExp(`[^${CUSTOM_DATA_VALID_CHARS}]`, "g"), "");
}

// The prefixed reference that uniquely identifies the data within a shape, e.g. "/attack/bonus"
export function getCustomDataFullReference(data: Pick<UiShapeCustomData, "name" | "prefix" | "reference">): string {
    const reference = data.reference ?? getCustomDataReference(data.name);
    if (data.prefix === "") return reference;
    return `${getCustomDataReference(data.prefix).replace(/\/+$/, "")}/${reference}`;
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
            raw: part[0],
            discriminator: (shapeId ?? shapeFocus)?.toString(),
            ref: customDataState.readonly.data
                .get(shapeId ?? shapeFocus ?? selectedState.reactive.focus!)
                ?.find(
                    (shapeData) =>
                        (prefix === undefined ||
                            getCustomDataReference(shapeData.prefix.toLowerCase()) === prefix.toLowerCase()) &&
                        (shapeData.reference?.toLowerCase() ?? getCustomDataReference(shapeData.name.toLowerCase())) ===
                            last.toLowerCase(),
                ),
        });
        nextIndex = part.index + part[0].length;
    }
    // no matches at all
    if (result.length === 0) {
        result.push({ text: data, isVariable: false });
    } else if (nextIndex < data.length) {
        result.push({ text: data.slice(nextIndex), isVariable: false });
    }
    return result;
}

export class VariableError extends Error {}

export function convertVariables(data: string, shapeFocus?: LocalId, seen: ReadonlySet<ElementId> = new Set()): string {
    let result = "";
    let previousWasVariable = false;
    for (const segment of getVariableSegments(data, shapeFocus)) {
        if (!segment.isVariable) {
            result += segment.text;
            previousWasVariable = false;
            continue;
        }
        const ref = segment.ref;
        if (ref === undefined) {
            throw new VariableError(i18n.global.t("game.ui.tools.DiceTool.unknown_variable", { name: segment.text }));
        }
        // Adjacent values should not merge into a single number
        if (previousWasVariable) result += " ";
        if (ref.kind === "dice-expression") {
            if (seen.has(ref.id)) {
                throw new VariableError(
                    i18n.global.t("game.ui.tools.DiceTool.recursive_variable", { name: segment.text }),
                );
            }
            // Variables in a dice expression refer to the shape that owns the expression
            const owner = getLocalId(ref.shapeId, false);
            result += `(${convertVariables(ref.value, owner, new Set([...seen, ref.id]))})`;
        } else {
            result += String(ref.value);
        }
        previousWasVariable = true;
    }
    return result;
}

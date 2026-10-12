import type { LocalId } from "../../../core/id";
import { i18n } from "../../../i18n";
import { getLocalId } from "../../id";
import { selectedState } from "../selected/state";

import { customDataState } from "./state";
import { type ElementId, type UiShapeCustomData } from "./types";

const CUSTOM_DATA_VALID_CHARS = "\\w /";
// The last group should mostly be kept in sync with the above (reads nicer as /../ compared to RegExp)
// A reference has the form {[localId]source:prefix/reference}, where everything but the reference is optional
// - The shape LocalId discriminator can only be used in dice tool input for now,
//   we might have to change this to a part of the GlobalId if we want to store this in the db
// - Source ids are not restricted to the valid chars (e.g. "srd-5.1"), so they are separated by a colon
const CUSTOM_DATA_REGEX = /{(\[\d+\])?(?:([^{}[\]:]+):)?([\w /]+)}/g;

type VariableSegment =
    | { text: string; isVariable: false }
    | {
          text: string;
          isVariable: true;
          raw: string;
          // Only set if exactly one element matches
          ref: UiShapeCustomData | undefined;
          matches: readonly UiShapeCustomData[];
          discriminator?: string;
      };

export function getCustomDataReference(name: string): string {
    return name.replaceAll(new RegExp(`[^${CUSTOM_DATA_VALID_CHARS}]`, "g"), "");
}

// The source qualified and prefixed reference that identifies the data within a shape, e.g. "srd-5.1:/attack/bonus"
export function getCustomDataFullReference(
    data: Pick<UiShapeCustomData, "name" | "prefix" | "reference" | "source">,
): string {
    const reference = data.reference ?? getCustomDataReference(data.name);
    if (data.prefix === "") return `${data.source}:${reference}`;
    return `${data.source}:${getCustomDataReference(data.prefix).replace(/\/+$/, "")}/${reference}`;
}

export type CustomDataLookup = (shape: LocalId) => readonly UiShapeCustomData[] | undefined;

const nonReactiveLookup: CustomDataLookup = (shape) => customDataState.readonly.data.get(shape);

export function getVariableSegments(
    data: string,
    shapeFocus?: LocalId,
    lookup: CustomDataLookup = nonReactiveLookup,
): VariableSegment[] {
    const result: VariableSegment[] = [];
    let nextIndex = 0;
    for (const part of data.matchAll(CUSTOM_DATA_REGEX)) {
        if (nextIndex < part.index) {
            result.push({ text: data.slice(nextIndex, part.index), isVariable: false });
            nextIndex = part.index;
        }
        const shapeMatch = part[1];
        const shapeId = shapeMatch !== undefined ? (Number.parseInt(shapeMatch.slice(1, -1)) as LocalId) : undefined;
        const source = part[2]?.toLowerCase();
        const refMatch = part[3]!;
        const parts = refMatch.split("/");
        if (parts.length === 0) continue;
        const last = parts.at(-1)!;
        let prefix = parts.length === 1 ? undefined : parts.slice(0, -1).join("/");
        if (prefix !== undefined && prefix[0] !== "/") prefix = `/${prefix}`;
        const matches = (lookup(shapeId ?? shapeFocus ?? selectedState.reactive.focus!) ?? []).filter(
            (shapeData) =>
                shapeData.pending === undefined &&
                (source === undefined || shapeData.source.toLowerCase() === source) &&
                (prefix === undefined ||
                    getCustomDataReference(shapeData.prefix.toLowerCase()) === prefix.toLowerCase()) &&
                (shapeData.reference?.toLowerCase() ?? getCustomDataReference(shapeData.name.toLowerCase())) ===
                    last.toLowerCase(),
        );
        result.push({
            text: last,
            isVariable: true,
            raw: part[0],
            discriminator: (shapeId ?? shapeFocus)?.toString(),
            ref: matches.length === 1 ? matches[0] : undefined,
            matches,
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

// Shows references by name only, the shape discriminator is not meaningful to other clients
// and the source and prefix make the expression harder to read
export function getDisplayExpression(data: string): string {
    return getVariableSegments(data)
        .map((segment) => (segment.isVariable ? `{${segment.text}}` : segment.text))
        .join("");
}

// Why a variable segment can not be resolved, if it can't
export function getVariableProblem(segment: VariableSegment): string | undefined {
    if (!segment.isVariable || segment.ref !== undefined) return;
    if (segment.matches.length === 0) {
        return i18n.global.t("game.ui.tools.DiceTool.unknown_variable", { name: segment.text });
    }
    const options = new Set(segment.matches.map((match) => `{${getCustomDataFullReference(match)}}`));
    return i18n.global.t("game.ui.tools.DiceTool.ambiguous_variable", {
        name: segment.text,
        options: [...options].join(", "),
    });
}

export class VariableError extends Error {}

export function convertVariables(
    data: string,
    shapeFocus?: LocalId,
    lookup: CustomDataLookup = nonReactiveLookup,
    seen: ReadonlySet<ElementId> = new Set(),
): string {
    let result = "";
    let previousWasVariable = false;
    for (const segment of getVariableSegments(data, shapeFocus, lookup)) {
        if (!segment.isVariable) {
            result += segment.text;
            previousWasVariable = false;
            continue;
        }
        const ref = segment.ref;
        if (ref === undefined) throw new VariableError(getVariableProblem(segment));
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
            result += `(${convertVariables(ref.value, owner, lookup, new Set([...seen, ref.id]))})`;
        } else {
            result += String(ref.value);
        }
        previousWasVariable = true;
    }
    return result;
}

// Every shape whose custom data `convertVariables` would read for this input
export function getReferencedShapes(
    data: string,
    shapeFocus: LocalId,
    lookup: CustomDataLookup = nonReactiveLookup,
    seen: ReadonlySet<ElementId> = new Set(),
): Set<LocalId> {
    const shapes = new Set([shapeFocus]);
    for (const segment of getVariableSegments(data, shapeFocus, lookup)) {
        if (!segment.isVariable) continue;
        if (segment.discriminator !== undefined) shapes.add(Number.parseInt(segment.discriminator) as LocalId);
        const ref = segment.ref;
        if (ref?.kind !== "dice-expression" || seen.has(ref.id)) continue;
        const owner = getLocalId(ref.shapeId, false);
        if (owner === undefined) continue;
        for (const shape of getReferencedShapes(ref.value, owner, lookup, new Set([...seen, ref.id])))
            shapes.add(shape);
    }
    return shapes;
}

import type { RollResult } from "@planarally/dice/core";
import { type DieSegment, type DxSegment, DxSegmentType, type ResolvedDieOutput } from "@planarally/dice/systems/dx";
import type {
    DiceRollError as ApiDiceRollError,
    DicePrefillOptions,
    DiceRollDie,
    DiceRollOptions,
    DiceRollOutcome,
    DiceRollPart,
    DiceSimplification,
    PendingDiceSimplification,
} from "@planarally/mod-api";
import { type MaybeRefOrGetter, type Ref, computed, onScopeDispose, shallowRef, toValue, watch } from "vue";
import { useToast } from "vue-toastification";

import type { LocalId } from "../core/id";
import { customDataSystem } from "../game/systems/customData";
import { customDataState } from "../game/systems/customData/state";
import {
    type CustomDataLookup,
    VariableError,
    convertVariables,
    getReferencedShapes,
} from "../game/systems/customData/utils";
import { diceSystem } from "../game/systems/dice";
import { DiceMathError, type MathJs, dxMathSyntax, loadDiceMath, resolveDiceMathSync } from "../game/systems/dice/math";
import { roomState } from "../game/systems/room/state";
import { i18n } from "../i18n";
import { coreStore } from "../store/core";

const toast = useToast();

function simplify(math: MathJs, expression: string, shape: LocalId, lookup?: CustomDataLookup): DiceSimplification {
    if (expression.trim().length === 0) {
        return { kind: "error", message: i18n.global.t("game.ui.tools.DiceTool.math_errors.empty") };
    }
    try {
        const resolved = resolveDiceMathSync(math, convertVariables(expression, shape, lookup), dxMathSyntax);
        if (/^-?\d+$/.test(resolved)) return { kind: "number", value: Number.parseInt(resolved, 10) };
        return { kind: "dice", expression: resolved };
    } catch (error) {
        if (error instanceof DiceMathError || error instanceof VariableError) {
            return { kind: "error", message: error.message };
        }
        throw error;
    }
}

export async function simplifyDiceExpression(expression: string, shape: LocalId): Promise<DiceSimplification> {
    return simplify(await loadDiceMath(), expression, shape);
}

// useSimplifiedDice leases every shape it reads, so the reactive state is complete for all lookups that matter
const leasedLookup: CustomDataLookup = (id) =>
    customDataState.reactive.data.get(id) ?? customDataState.readonly.data.get(id);

export function useSimplifiedDice(
    expression: MaybeRefOrGetter<string>,
    shape: MaybeRefOrGetter<LocalId | null | undefined>,
): Readonly<Ref<DiceSimplification | PendingDiceSimplification | undefined>> {
    const lease = Symbol("dice simplification");

    const math = shallowRef<MathJs>();
    loadDiceMath()
        .then((loaded) => {
            math.value = loaded;
        })
        .catch((error: unknown) => {
            console.error(error);
        });

    const target = computed(() => toValue(shape) ?? undefined);
    const input = computed(() => toValue(expression));

    // Synchronous, so the leases are in place before the simplification below reads the reactive state
    watch(
        () =>
            target.value === undefined
                ? new Set<LocalId>()
                : getReferencedShapes(input.value, target.value, leasedLookup),
        (shapes) => {
            customDataSystem.loadAndDropState(shapes, lease);
        },
        { immediate: true, flush: "sync" },
    );
    onScopeDispose(() => {
        customDataSystem.loadAndDropState(new Set(), lease);
    });

    return computed(() => {
        if (target.value === undefined) return undefined;
        if (math.value === undefined) return { kind: "pending" };
        return simplify(math.value, input.value, target.value, leasedLookup);
    });
}

class DiceRollError extends Error implements ApiDiceRollError {
    override readonly name = "DiceRollError";

    constructor(
        message: string,
        readonly reason: ApiDiceRollError["reason"],
    ) {
        super(message);
    }
}

function assertDiceEnabled(): void {
    if (!roomState.raw.enableDice) {
        throw new DiceRollError(i18n.global.t("game.ui.tools.DiceTool.disabled"), "disabled");
    }
}

function toDiceRollError(error: unknown): DiceRollError | undefined {
    if (error instanceof DiceRollError) return error;
    if (error instanceof VariableError) return new DiceRollError(error.message, "reference");
    if (error instanceof DiceMathError) return new DiceRollError(error.message, "math");
    return undefined;
}

// Mirrors how the DX dice system adds up die results
function isCounted(part: DieSegment, die: ResolvedDieOutput[number]): boolean {
    if (die.status === "overridden") return false;
    if (part.operator === "keep") return die.status === "kept";
    if (part.operator === "drop") return die.status !== "dropped";
    return true;
}

function toOutcomePart(part: RollResult<DxSegment>["parts"][number]): DiceRollPart {
    if (part.type === DxSegmentType.Operator) return { kind: "operator", operator: part.input };
    if (part.type === DxSegmentType.Literal) return { kind: "number", value: part.value };
    // Rolled dice carry their results, which the generic RollResult type doesn't know about
    const output = (part as typeof part & { output?: ResolvedDieOutput }).output ?? [];
    return {
        kind: "dice",
        expression: part.input ?? "",
        amount: part.amount,
        sides: Number.parseInt(part.die.slice(1), 10),
        total: Number.parseInt(part.shortResult, 10),
        dice: output.map((die): DiceRollDie => ({
            value: die.roll,
            counted: isCounted(part, die),
            ...(die.status === undefined ? {} : { status: die.status }),
        })),
    };
}

export async function rollDice(expression: string, options: DiceRollOptions = {}): Promise<DiceRollOutcome> {
    const { diceTool } = await import("../game/tools/variants/dice");
    let result: Awaited<ReturnType<typeof diceTool.roll>>;
    try {
        assertDiceEnabled();
        result = await diceTool.roll(expression, {
            shape: options.shape,
            label: options.label,
            use3d: options.use3d,
            shareWith: options.shareWith,
        });
    } catch (error) {
        const rollError = toDiceRollError(error);
        if (rollError === undefined) throw error;
        if (options.silent !== true) toast.error(rollError.message);
        throw rollError;
    }

    // The dice tool shows its own rolls in the tool, rolls from mods get the toast other players see
    diceSystem.showRollToast(coreStore.state.username, result.display, result.roll);

    return {
        total: Number.parseInt(result.roll.result, 10),
        input: expression,
        label: options.label,
        expression: result.resolved,
        parts: result.roll.parts.map(toOutcomePart),
        shareWith: result.shareWith,
        used3d: result.used3d,
    };
}

export async function prefillDice(expression: string, options: DicePrefillOptions = {}): Promise<void> {
    assertDiceEnabled();
    const { prefillDiceTool } = await import("../game/systems/dice/prefill");
    prefillDiceTool(expression, options.shape);
}

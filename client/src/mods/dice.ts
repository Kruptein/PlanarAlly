import type { DiceSimplification, PendingDiceSimplification } from "@planarally/mod-api";
import { type MaybeRefOrGetter, type Ref, computed, onScopeDispose, shallowRef, toValue, watch } from "vue";

import type { LocalId } from "../core/id";
import { customDataSystem } from "../game/systems/customData";
import { customDataState } from "../game/systems/customData/state";
import {
    type CustomDataLookup,
    VariableError,
    convertVariables,
    getReferencedShapes,
} from "../game/systems/customData/utils";
import { DiceMathError, type MathJs, dxMathSyntax, loadDiceMath, resolveDiceMathSync } from "../game/systems/dice/math";
import { i18n } from "../i18n";

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

import { type Part, type RollResult, type SYSTEMS } from "@planarally/dice/core";
import type { DeepReadonly } from "vue";

import type { LocalId } from "../../../core/id";
import { buildState } from "../../../core/systems/state";
import type { AsyncReturnType } from "../../../core/types";

import { DiceUiState } from "./types";

export interface DiceHistoryEntry {
    roll: RollResult<Part>;
    player: string;
    // The expression as entered, with variables shown by name
    input: string;
    // The expression that was actually rolled, only set if it differs from the input
    resolved?: string;
    // The exact text input including variable references, only available for own rolls
    rawInput?: string;
}

interface DiceState {
    uiState: DiceUiState;
    uiActiveShapeId: LocalId | undefined;
    textInput: string;
    lastCursorPosition: number;
    updateInputCursor: boolean;
    dimensions3d: { width: number; height: number };
    history: DiceHistoryEntry[];
    systems?: {
        "2d": AsyncReturnType<typeof SYSTEMS.DX>["DX"];
        "3d": AsyncReturnType<typeof SYSTEMS.DX3>["DX3"];
    };
    result?: DeepReadonly<RollResult<Part>>;
}

const state = buildState<DiceState>({
    uiState: DiceUiState.Roll,
    uiActiveShapeId: undefined,
    lastCursorPosition: 0,
    updateInputCursor: false,
    dimensions3d: { width: 0, height: 0 },
    history: [],
    textInput: "",
});
export const diceState = {
    ...state,
};

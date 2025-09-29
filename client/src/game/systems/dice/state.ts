import { type Part, type RollResult, type SYSTEMS } from "@planarally/dice/core";
import type { DeepReadonly } from "vue";

import type { LocalId } from "../../../core/id";
import { buildState } from "../../../core/systems/state";
import type { AsyncReturnType } from "../../../core/types";

import { DiceUiState } from "./types";

interface DiceState {
    uiState: LocalId | DiceUiState;
    textInput: string;
    updateTextInputScroll: boolean;
    dimensions3d: { width: number; height: number };
    history: { roll: RollResult<Part>; name: string; player: string }[];
    systems?: { "2d": AsyncReturnType<typeof SYSTEMS.DX>["DX"]; "3d": AsyncReturnType<typeof SYSTEMS.DX3>["DX3"] };
    result?: DeepReadonly<RollResult<Part>>;
}

const state = buildState<DiceState>({
    uiState: DiceUiState.Roll,
    updateTextInputScroll: false,
    dimensions3d: { width: 0, height: 0 },
    history: [],
    textInput: "",
});
export const diceState = {
    ...state,
};

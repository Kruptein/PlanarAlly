import { type Part, type RollResult, type SYSTEMS } from "@planarally/dice/core";
import type { DeepReadonly } from "vue";

import type { AsyncReturnType } from "../../../core/types";
import { buildState } from "../state";

interface DiceState {
    dimensions3d: { width: number; height: number };
    history: { roll: RollResult<Part>; name: string; player: string }[];
    loaded3d: boolean;
    systems?: { "2d": AsyncReturnType<typeof SYSTEMS.DX>["DX"]; "3d": AsyncReturnType<typeof SYSTEMS.DX3>["DX3"] };
    result?: DeepReadonly<RollResult<Part>>;
}

const state = buildState<DiceState>({
    dimensions3d: { width: 0, height: 0 },
    history: [],
    loaded3d: false,
});
export const diceState = {
    ...state,
};

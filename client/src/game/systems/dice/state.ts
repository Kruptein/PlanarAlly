import type { Part, RollResult } from "@planarally/dice/core";
import type { DeepReadonly } from "vue";

import { buildState } from "../state";

interface DiceState {
    dimensions3d: { width: number; height: number };
    history: { roll: RollResult<Part>; name: string; player: string }[];
    loaded3d: boolean;
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

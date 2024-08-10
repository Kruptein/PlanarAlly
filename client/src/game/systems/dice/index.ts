import type { Part, RollResult } from "@planarally/dice/core";
import type { DeepReadonly } from "vue";

import { registerSystem } from "..";
import type { System } from "..";

import { loadDiceEnv } from "./environment";
import { diceState } from "./state";

const { mutableReactive: $ } = diceState;

class DiceSystem implements System {
    clear(): void {}

    addToHistory(roll: RollResult<Part>, player: string, name?: string): string {
        let rollString = "";
        for (const part of roll.parts) rollString += ` ${part.input}`;
        $.history.push({ roll, player, name: name ?? rollString });
        return rollString;
    }

    async load3d(): Promise<void> {
        if (!diceState.raw.loaded3d) {
            await loadDiceEnv();
            $.loaded3d = true;
        }
    }

    set3dDimensions(width: number, height: number): void {
        $.dimensions3d = { width, height };
    }

    showResults(roll: DeepReadonly<RollResult<Part>>): void {
        $.result = roll;
    }
}

export const diceSystem = new DiceSystem();
registerSystem("dice", diceSystem, false, diceState);

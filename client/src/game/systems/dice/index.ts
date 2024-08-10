import { SYSTEMS, type Part, type RollResult } from "@planarally/dice/core";
import type { DeepReadonly } from "vue";

import { registerSystem } from "..";
import type { System } from "..";
import type { SystemClearReason } from "../models";

import { loadDiceEnv } from "./environment";
import { diceState } from "./state";

const { mutableReactive: $ } = diceState;

class DiceSystem implements System {
    clear(reason: SystemClearReason): void {
        $.result = undefined;
        if (reason !== "full-loading") {
            $.history = [];
            $.loaded3d = false;
        }
    }

    addToHistory(roll: RollResult<Part>, player: string, name?: string): string {
        let rollString = "";
        for (const part of roll.parts) rollString += ` ${part.input}`;
        $.history.push({ roll, player, name: name ?? rollString });
        return rollString;
    }

    async loadSystems(): Promise<void> {
        if ($.systems) return;

        const { DX } = await SYSTEMS.DX();
        const { DX3 } = await SYSTEMS.DX3();
        $.systems = { "2d": DX, "3d": DX3 };
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

import { SYSTEMS, type Part, type RollResult } from "@planarally/dice/core";
import type { DeepReadonly } from "vue";

import { registerSystem } from "../../../core/systems";
import type { System } from "../../../core/systems";
import type { SystemClearReason } from "../../../core/systems/models";
import type { AsyncReturnType } from "../../../core/types";

import { diceState } from "./state";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const _env = () => import("./environment");

const { mutableReactive: $ } = diceState;

export async function getDiceEnvironment(): Promise<AsyncReturnType<typeof _env>> {
    return await _env();
}

class DiceSystem implements System {
    clear(reason: SystemClearReason): void {
        $.result = undefined;
        if (reason !== "full-loading") {
            $.history = [];
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

    async load3d(canvas?: HTMLCanvasElement): Promise<void> {
        const env = await getDiceEnvironment();
        await env.loadDiceEnv(canvas);
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

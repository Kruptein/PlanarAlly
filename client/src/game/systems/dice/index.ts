import type { DiceThrower } from "@planarally/dice/3d";
import { SYSTEMS, type Part, type RollResult } from "@planarally/dice/core";
import type { DeepReadonly } from "vue";
import { POSITION, useToast } from "vue-toastification";

import { registerSystem } from "../../../core/systems";
import type { System, SystemClearReason } from "../../../core/systems/models";
import type { AsyncReturnType } from "../../../core/types";

import { diceState } from "./state";
import { DiceUiState } from "./types";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const _env = () => import("./environment");

const { mutableReactive: $ } = diceState;

const toast = useToast();

export async function getDiceEnvironment(): Promise<AsyncReturnType<typeof _env>> {
    return await _env();
}

function withoutSpaces(text: string): string {
    return text.replaceAll(/\s/g, "");
}

class DiceSystem implements System {
    private boxCanvas: HTMLCanvasElement | undefined;

    clear(reason: SystemClearReason): void {
        $.result = undefined;
        if (reason !== "full-loading") {
            $.history = [];
            $.lastRoll = undefined;
        }
    }

    setInput(input: string): void {
        $.lastCursorPosition = input.length;
        $.textInput = input;
        $.updateInputCursor = true;
        $.uiState = DiceUiState.Roll;
    }

    addToHistory(roll: RollResult<Part>, player: string, input?: { display: string; raw?: string }): string {
        const resolved = roll.parts.map((part) => part.input ?? "").join(" ");
        const display = input?.display ?? resolved;
        $.history.push({
            roll,
            player,
            input: display,
            resolved: withoutSpaces(display) === withoutSpaces(resolved) ? undefined : resolved,
            rawInput: input?.raw,
        });
        return display;
    }

    get isLoaded(): boolean {
        return $.systems !== undefined;
    }

    async loadSystems(): Promise<void> {
        if ($.systems) return;

        const { DX } = await SYSTEMS.DX();
        const { DX3 } = await SYSTEMS.DX3();
        $.systems = { "2d": DX, "3d": DX3 };
    }

    async load3d(canvas?: HTMLCanvasElement): Promise<DiceThrower> {
        const env = await getDiceEnvironment();
        return await env.loadDiceEnv(canvas);
    }

    setBoxCanvas(canvas: HTMLCanvasElement | undefined): void {
        this.boxCanvas = canvas;
    }

    // The thrower matching the player's 3D setting, undefined if 3D dice can't be used and rolls should be 2D
    async getThrower(): Promise<DiceThrower | undefined> {
        // The dice box is part of the dice tool UI, while it's hidden the full screen environment is used instead
        const canvas =
            diceState.raw.dice3d === "box" && this.boxCanvas?.checkVisibility() === true ? this.boxCanvas : undefined;
        try {
            return await this.load3d(canvas);
        } catch (error) {
            console.warn("Could not load the 3D dice environment, rolling 2D dice instead", error);
            return undefined;
        }
    }

    showRollToast(player: string, display: string, roll: DeepReadonly<RollResult<Part>>): void {
        toast.info(`${player} rolled ${display} and threw a ${roll.result}`, {
            position: POSITION.TOP_RIGHT,
            onClick: () => this.showResults(roll),
        });
    }

    getSystem(
        name: "2d" | "3d",
    ): AsyncReturnType<typeof SYSTEMS.DX>["DX"] | AsyncReturnType<typeof SYSTEMS.DX3>["DX3"] | undefined {
        return $.systems?.[name];
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

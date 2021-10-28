import type { DiceThrower, DndParser, DndResult } from "@planarally/dice";

import { Store } from "../../core/store";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const env = () => import("./environment");
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const dice = () => import("@planarally/dice");

interface DiceState {
    showUi: boolean;
    pending: boolean;
    results: DndResult[];
    dimensions: { width: number; height: number };
    loaded: boolean;
}

class DiceStore extends Store<DiceState> {
    private diceThrower!: DiceThrower;
    private dndParser!: DndParser;

    protected data(): DiceState {
        return {
            showUi: false,
            pending: false,
            results: [],
            dimensions: { width: 0, height: 0 },
            loaded: false,
        };
    }

    async loadEnv(): Promise<void> {
        if (this._state.loaded === true) {
            return;
        }
        const e = await env();
        const { DndParser } = await dice();
        // const { Vector3 } = await math();
        this.diceThrower = await e.loadDiceEnv();
        this.dndParser = new DndParser(this.diceThrower);
        this._state.loaded = true;
    }

    async getDiceThrower(): Promise<DiceThrower> {
        if (!this._state.loaded) {
            await this.loadEnv();
        }
        return this.diceThrower;
    }

    async getDndParser(): Promise<DndParser> {
        if (!this._state.loaded) {
            await this.loadEnv();
        }
        return this.dndParser;
    }

    setResults(results: DndResult[]): void {
        this._state.results = results;
    }

    setShowDiceResults(show: boolean): void {
        this._state.showUi = show;
    }

    setIsPending(pending: boolean): void {
        this._state.pending = pending;
    }

    setDimensions(width: number, height: number): void {
        this._state.dimensions = { width, height };
    }
}

export const diceStore = new DiceStore();
(window as any).diceStore = diceStore;

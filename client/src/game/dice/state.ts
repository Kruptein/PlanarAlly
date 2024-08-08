// import type { DiceThrower, DndParser, DndResult } from "@planarally/dice";
import { Store } from "../../core/store";

import { loadDiceEnv } from "./environment";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
// const env = () => import("./environment");
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
// const dice = () => import("@planarally/dice");

interface DiceState {
    showKey: string | undefined;
    pending: boolean;
    // results: Map<string, { position?: [number, number]; results: DndResult[] }>;
    dimensions: { width: number; height: number };
    loaded: boolean;
}

class DiceStore extends Store<DiceState> {
    // private diceThrower!: DiceThrower;
    // private dndParser!: DndParser;

    protected data(): DiceState {
        return {
            showKey: undefined,
            pending: false,
            // results: new Map(),
            dimensions: { width: 0, height: 0 },
            loaded: false,
        };
    }

    async loadEnv(): Promise<void> {
        if (this._state.loaded) {
            return;
        }
        // const e = await env();
        // const { DndParser } = await dice();
        // const { Vector3 } = await math();
        // this.diceThrower = await e.loadDiceEnv();
        // await e.loadDiceEnv();
        await loadDiceEnv();
        // this.dndParser = new DndParser(this.diceThrower);
        this._state.loaded = true;
    }

    // async getDiceThrower(): Promise<DiceThrower> {
    //     if (!this._state.loaded) {
    //         await this.loadEnv();
    //     }
    //     return this.diceThrower;
    // }

    // async getDndParser(): Promise<DndParser> {
    //     if (!this._state.loaded) {
    //         await this.loadEnv();
    //     }
    //     return this.dndParser;
    // }

    // getResults(key: string): DndResult[] {
    //     return this._state.results.get(key)?.results ?? [];
    // }

    // getTotal(key: string): number {
    //     let result = 0;
    //     for (const data of this._state.results.get(key)?.results ?? []) {
    //         result += data.total;
    //     }
    //     return result;
    // }

    // getResultString(key: string): string {
    //     const result = this._state.results.get(key)?.results[0];
    //     if (result === undefined) {
    //         return "";
    //     }
    //     return (
    //         "(" +
    //         result.details
    //             .map((part) =>
    //                 part.type === "dice"
    //                     ? part.output.join("+")
    //                     : part.type === "fixed"
    //                       ? part.output
    //                       : `) ${part.value} (`,
    //             )
    //             .join("") +
    //         `) = ${result.total}`
    //     );
    // }

    // setResults(key: string, results: DndResult[], position?: [number, number]): void {
    //     this._state.results.set(key, { position, results });
    // }

    setShowDiceResults(key: string | undefined): void {
        this._state.showKey = key;
    }

    setIsPending(pending: boolean): void {
        this._state.pending = pending;
    }

    setDimensions(width: number, height: number): void {
        this._state.dimensions = { width, height };
    }
}

export const diceStore = new DiceStore();
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(window as any).diceStore = diceStore;

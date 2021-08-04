import { DndResult } from "@planarally/dice";

import { Store } from "../../core/store";

interface DiceState {
    showUi: boolean;
    pending: boolean;
    results: DndResult[];
    dimensions: { width: number; height: number };
}

class DiceStore extends Store<DiceState> {
    protected data(): DiceState {
        return {
            showUi: false,
            pending: false,
            results: [],
            dimensions: { width: 0, height: 0 },
        };
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

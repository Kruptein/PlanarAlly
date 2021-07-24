import { DndResult } from "@planarally/dice";

import { Store } from "../../core/store";

interface DiceState {
    showUi: boolean;
    pending: boolean;
    results: DndResult[];
}

class DiceStore extends Store<DiceState> {
    protected data(): DiceState {
        return {
            showUi: false,
            pending: false,
            results: [],
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
}

export const diceStore = new DiceStore();
(window as any).diceStore = diceStore;

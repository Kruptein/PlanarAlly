import { Store } from "../../core/store";
import { IdMap } from "../../store/shapeMap";
import type { IShape } from "../shapes/interfaces";
import type { LocalId } from "../shapes/localId";

import { compositeState } from "./state";

interface State {
    selection: Set<LocalId>;
    uiHelpers: Set<LocalId>;
}

class SelectionState extends Store<State> {
    protected data(): State {
        return {
            selection: new Set(),
            uiHelpers: new Set(),
        };
    }

    get hasSelection(): boolean {
        return this.state.selection.size > 0;
    }

    clear(): void {
        this._state.selection.clear();
    }

    // UI helpers are objects that are created for UI reaons but that are not pertinent to the actual state
    // They are often not desired unless in specific circumstances
    get(options: { includeComposites: boolean; includeUiHelpers?: boolean }): readonly IShape[] {
        const shapes: IShape[] = [];
        for (const selection of this._state.selection) {
            shapes.push(IdMap.get(selection)!);
        }
        if (options.includeUiHelpers === true) {
            for (const selection of this._state.uiHelpers) {
                shapes.push(IdMap.get(selection)!);
            }
        }
        return options.includeComposites ? compositeState.addAllCompositeShapes(shapes) : shapes;
    }

    push(...selection: IShape[]): void {
        for (const sel of selection) {
            this._state.selection.add(sel.id);
        }
    }

    set(...selection: IShape[]): void {
        this._state.selection.clear();
        this.push(...selection);
    }

    remove(shape: LocalId): void {
        this._state.selection.delete(shape);
    }
}

export const selectionState = new SelectionState();
(window as any).selectionState = selectionState;

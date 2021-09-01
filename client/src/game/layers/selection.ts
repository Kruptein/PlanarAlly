import { Store } from "../../core/store";
import { floorStore } from "../../store/floor";
import { UuidMap } from "../../store/shapeMap";
import type { Shape } from "../shapes/shape";

import { compositeState } from "./state";

interface State {
    selection: Set<string>;
    uiHelpers: Set<string>;
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

    clear(invalidate: boolean): void {
        this._state.selection.clear();
        if (invalidate) floorStore.currentLayer.value!.invalidate(true);
    }

    // UI helpers are objects that are created for UI reaons but that are not pertinent to the actual state
    // They are often not desired unless in specific circumstances
    get(options: { includeComposites: boolean; includeUiHelpers?: boolean }): readonly Shape[] {
        const shapes: Shape[] = [];
        for (const selection of this._state.selection) {
            shapes.push(UuidMap.get(selection)!);
        }
        if (options.includeUiHelpers === true) {
            for (const selection of this._state.uiHelpers) {
                shapes.push(UuidMap.get(selection)!);
            }
        }
        return options.includeComposites ? compositeState.addAllCompositeShapes(shapes) : shapes;
    }

    push(...selection: Shape[]): void {
        for (const sel of selection) {
            this._state.selection.add(sel.uuid);
        }
    }

    set(...selection: Shape[]): void {
        this._state.selection.clear();
        this.push(...selection);
    }

    remove(shape: string): void {
        this._state.selection.delete(shape);
    }
}

export const selectionState = new SelectionState();
(window as any).selectionState = selectionState;

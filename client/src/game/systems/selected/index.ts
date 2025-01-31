import type { LocalId } from "../../../core/id";
import { registerSystem } from "../../../core/systems";
import type { ShapeSystem } from "../../../core/systems";
import { getShape } from "../../id";
import type { IShape } from "../../interfaces/shape";
import { compositeState } from "../../layers/state";

import { selectedState } from "./state";

const { mutableReactive: $ } = selectedState;

class SelectedSystem implements ShapeSystem {
    // BEHAVIOUR

    clear(): void {
        $.selected.clear();
        $.focus = undefined;
    }

    drop(id: LocalId): void {
        this.remove(id);
    }

    inform(id: LocalId): void {
        this.push(id);
    }

    // Should only be used to update the focus within a selection (e.g. clicking on an already selected shape)
    focus(id: LocalId): void {
        $.focus = id;
    }

    push(...selection: LocalId[]): void {
        for (const sel of selection) {
            if ($.focus === undefined) $.focus = sel;
            $.selected.add(sel);
        }
    }

    set(...ids: LocalId[]): void {
        this.clear();
        this.push(...ids);
    }

    remove(id: LocalId): void {
        $.selected.delete(id);
        $.focus = [...$.selected][0];
    }

    get hasSelection(): boolean {
        return $.selected.size > 0;
    }

    get(options: { includeComposites: boolean }): readonly IShape[] {
        const shapes: IShape[] = [];
        for (const selection of $.selected) {
            shapes.push(getShape(selection)!);
        }
        return options.includeComposites ? compositeState.addAllCompositeShapes(shapes) : shapes;
    }
}

export const selectedSystem = new SelectedSystem();
registerSystem("selected", selectedSystem, true, selectedState);

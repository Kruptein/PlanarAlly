import { readonly, ref } from "vue";
import type { DeepReadonly, Ref } from "vue";

import { registerSystem } from "..";
import type { ShapeSystem } from "..";
import { getShape } from "../../id";
import type { LocalId } from "../../id";
import type { IShape } from "../../interfaces/shape";
import { compositeState } from "../../layers/state";

class SelectedSystem implements ShapeSystem {
    // REACTIVE STATE

    private selected = ref<Set<LocalId>>(new Set());
    private focus = ref<LocalId | undefined>(undefined);

    get $(): DeepReadonly<Ref<Set<LocalId>>> {
        return this.selected;
    }

    // BEHAVIOUR

    clear(): void {
        this.selected.value.clear();
        this.focus.value = undefined;
    }

    drop(id: LocalId): void {
        this.remove(id);
    }

    inform(id: LocalId): void {
        this.push(id);
    }

    push(...selection: LocalId[]): void {
        for (const sel of selection) {
            if (this.focus.value === undefined) this.focus.value = sel;
            this.selected.value.add(sel);
        }
    }

    set(...ids: LocalId[]): void {
        this.clear();
        this.push(...ids);
    }

    remove(id: LocalId): void {
        this.selected.value.delete(id);
        this.focus.value = [...this.selected.value][0];
    }

    get hasSelection(): boolean {
        return this.selected.value.size > 0;
    }

    getFocus(): Readonly<Ref<LocalId | undefined>> {
        return readonly(this.focus);
    }

    get(options: { includeComposites: boolean }): readonly IShape[] {
        const shapes: IShape[] = [];
        for (const selection of this.selected.value) {
            shapes.push(getShape(selection)!);
        }
        return options.includeComposites ? compositeState.addAllCompositeShapes(shapes) : shapes;
    }
}

export const selectedSystem = new SelectedSystem();
registerSystem("selected", selectedSystem, true);

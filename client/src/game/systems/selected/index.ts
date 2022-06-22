import { readonly, ref } from "vue";
import type { Ref } from "vue";

import { registerSystem } from "..";
import type { ShapeSystem } from "..";
import type { LocalId } from "../../id";

class SelectedSystem implements ShapeSystem {
    // REACTIVE STATE

    private selected = ref<Set<LocalId>>(new Set());
    private focus = ref<LocalId | undefined>(undefined);

    // BEHAVIOUR

    clear(): void {
        this.selected.value.clear();
        this.focus.value = undefined;
    }

    drop(id: LocalId): void {
        this.selected.value.delete(id);
        this.focus.value = [...this.selected.value][0];
    }

    inform(id: LocalId, override = true): void {
        if (override) this.clear();
        if (this.focus.value === undefined) this.focus.value = id;
        this.selected.value.add(id);
    }

    getFocus(): Readonly<Ref<LocalId | undefined>> {
        return readonly(this.focus);
    }
}

export const selectedSystem = new SelectedSystem();
registerSystem("selected", selectedSystem, true);

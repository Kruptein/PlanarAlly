import { computed, type ComputedRef, type DeepReadonly } from "vue";

import { selectedState } from "../selected/state";

import { propertiesState } from "./state";
import { type ShapeProperties } from "./types";

export function useShapeProps(): ComputedRef<DeepReadonly<ShapeProperties> | undefined> {
    return computed(() => {
        const focus = selectedState.reactive.focus;
        if (focus) {
            return propertiesState.reactive.data.get(focus);
        }
        return undefined;
    });
}

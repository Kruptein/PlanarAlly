import type { LocalId } from "../../../core/id";
import { buildState } from "../../../core/systems/state";

import type { UiShapeCustomData } from "./types";

interface ReactiveCustomDataState {
    leases: Map<LocalId, Set<string>>;
    data: Map<LocalId, UiShapeCustomData[]>;
}

interface CustomDataState {
    data: Map<LocalId, UiShapeCustomData[]>;
}

const state = buildState<ReactiveCustomDataState, CustomDataState>(
    { leases: new Map(), data: new Map() },
    { data: new Map() },
);

export const customDataState = {
    ...state,
};

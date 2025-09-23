import type { LocalId } from "../../../core/id";
import { buildState } from "../../../core/systems/state";

import type { UiShapeCustomData } from "./types";

interface ReactiveCustomDataState {
    id: LocalId | undefined;
    data: UiShapeCustomData[];
}

interface CustomDataState {
    data: Map<LocalId, UiShapeCustomData[]>;
}

const state = buildState<ReactiveCustomDataState, CustomDataState>({ id: undefined, data: [] }, { data: new Map() });

export const customDataState = {
    ...state,
};

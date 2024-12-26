import type { DeepReadonly } from "vue";

import type { LocalId } from "../../../../core/id";
import { buildState } from "../../../../core/systems/state";
import { DEFAULT_PERMISSIONS } from "../models";
import type { Permissions } from "../models";

import type { DoorOptions, DOOR_TOGGLE_MODE } from "./models";

interface DoorState {
    data: Map<LocalId, DoorOptions>;
    enabled: Set<LocalId>;
}

interface ReactiveDoorState {
    id: LocalId | undefined;
    enabled: boolean;
    permissions?: DeepReadonly<Permissions>;
    toggleMode: DOOR_TOGGLE_MODE;
}

const state = buildState<ReactiveDoorState, DoorState>(
    {
        id: undefined,
        enabled: false,
        toggleMode: "both",
    },
    {
        data: new Map(),
        enabled: new Set(),
    },
);

function loadState(id: LocalId): void {
    const data = state.readonly.data.get(id) ?? DEFAULT_OPTIONS();
    state.mutableReactive.id = id;
    state.mutableReactive.enabled = state.readonly.enabled.has(id);
    state.mutableReactive.permissions = data.permissions;
    state.mutableReactive.toggleMode = data.toggleMode;
}

function dropState(): void {
    state.mutableReactive.id = undefined;
}

const DEFAULT_OPTIONS: () => DoorOptions = () => ({
    permissions: DEFAULT_PERMISSIONS(),
    toggleMode: "both",
});

export const doorLogicState = {
    ...state,
    dropState,
    loadState,
    DEFAULT_OPTIONS,
};

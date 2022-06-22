import { reactive, readonly } from "vue";

import type { LocalId } from "../../../id";
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
    permissions?: Permissions;
    toggleMode: DOOR_TOGGLE_MODE;
}

const reactiveState = reactive<ReactiveDoorState>({
    id: undefined,
    enabled: false,
    toggleMode: "both",
});

const state: DoorState = {
    data: new Map(),
    enabled: new Set(),
};

function loadState(id: LocalId): void {
    const data = state.data.get(id) ?? DEFAULT_OPTIONS();
    reactiveState.id = id;
    reactiveState.enabled = state.enabled.has(id);
    reactiveState.permissions = data.permissions;
    reactiveState.toggleMode = data.toggleMode;
}

function dropState(): void {
    reactiveState.id = undefined;
}

const DEFAULT_OPTIONS: () => DoorOptions = () => ({
    permissions: DEFAULT_PERMISSIONS(),
    toggleMode: "both",
});

export const doorLogicState = {
    $: readonly(reactiveState),
    _$: reactiveState,
    _: state,
    dropState,
    loadState,
    DEFAULT_OPTIONS,
};

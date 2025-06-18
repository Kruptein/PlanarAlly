import { computed } from "vue";

import type { LocalId } from "../../../core/id";
import { buildState } from "../../../core/systems/state";
import { LayerName } from "../../models/floor";
import { floorSystem } from "../floors";
import { floorState } from "../floors/state";
import { gameState } from "../game/state";
import { playerSystem } from "../players";

import { ACCESS_LEVELS, DEFAULT_ACCESS } from "./models";
import type { AccessMap, AccessConfig, AccessLevel } from "./models";

interface ReactiveAccessState {
    id: LocalId | undefined;
    defaultAccess: AccessConfig;
    playerAccess: Map<string, AccessConfig>;

    ownedTokens: Map<AccessLevel, Set<LocalId>>;
    activeTokenFilters: Map<AccessLevel, Set<LocalId>>;
}

interface AccessState {
    // If a LocalId is NOT in the access map,
    // it is assumed to have default access settings
    // this is the case for the vast majority of shapes
    // and would thus just waste memory
    access: Map<LocalId, AccessMap>;
}

const state = buildState<ReactiveAccessState, AccessState>(
    {
        id: undefined,
        defaultAccess: DEFAULT_ACCESS,
        playerAccess: new Map(),

        ownedTokens: new Map(ACCESS_LEVELS.map((al) => [al, new Set<LocalId>()])),
        activeTokenFilters: new Map(),
    },
    { access: new Map<LocalId, AccessMap>() },
);

const activeTokens = computed(() => {
    // this is used to update OOB tokens
    // This feels a bit out of place though
    // should probably be triggered in a separate watcher
    const floor = floorState.currentFloor.value;
    if (floor !== undefined) floorSystem.getLayer(floor, LayerName.Draw)?.invalidate(true);

    // grab active tokens for normal flow
    const tokens: Map<AccessLevel, ReadonlySet<LocalId>> = new Map(
        ACCESS_LEVELS.map((al) => [
            al,
            state.reactive.activeTokenFilters.get(al) ?? state.reactive.ownedTokens.get(al) ?? new Set(),
        ]),
    );

    return tokens;
});

export const accessState = {
    ...state,

    activeTokens,

    hasEditAccess: computed(() => {
        if (state.reactive.id === undefined) return false;
        if (gameState.reactive.isDm) return true;
        if (gameState.reactive.isFakePlayer && activeTokens.value.get("edit")!.has(state.reactive.id)) return true;
        if (state.reactive.defaultAccess.edit) return true;
        const username = playerSystem.getCurrentPlayer()?.name;
        return [...state.reactive.playerAccess.entries()].some(([u, a]) => u === username && a.edit);
    }),

    owners: computed(() => {
        if (state.reactive.id === undefined) return [];
        return [...state.reactive.playerAccess.keys()];
    }),
};

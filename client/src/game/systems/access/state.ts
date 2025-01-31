import { computed } from "vue";

import type { LocalId } from "../../../core/id";
import { filter, some } from "../../../core/iter";
import { buildState } from "../../../core/systems/state";
import { LayerName } from "../../models/floor";
import { floorSystem } from "../floors";
import { floorState } from "../floors/state";
import { gameState } from "../game/state";
import { playerSystem } from "../players";

import { DEFAULT_ACCESS } from "./models";
import type { AccessMap, ShapeAccess } from "./models";

interface ReactiveAccessState {
    id: LocalId | undefined;
    defaultAccess: ShapeAccess;
    playerAccess: Map<string, ShapeAccess>;

    ownedTokens: Set<LocalId>;
    activeTokenFilters: Set<LocalId> | undefined;
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

        ownedTokens: new Set(),
        activeTokenFilters: undefined,
    },
    { access: new Map<LocalId, AccessMap>() },
);

function playerWithVision(shapeId: LocalId): boolean {
    const access = state.readonly.access.get(shapeId);
    if (access === undefined) return false;
    return some(access.values(), (a) => a.vision);
}

const activeTokens = computed(() => {
    // this is used to update OOB tokens
    // This feels a bit out of place though
    // should probably be triggered in a separate watcher
    const floor = floorState.currentFloor.value;
    if (floor !== undefined) floorSystem.getLayer(floor, LayerName.Draw)?.invalidate(true);

    // grab active tokens for normal flow
    let tokens: ReadonlySet<LocalId>;
    if (state.reactive.activeTokenFilters !== undefined) tokens = state.reactive.activeTokenFilters;
    else tokens = state.reactive.ownedTokens;

    // Filter when we're faking it
    if (gameState.reactive.isFakePlayer) {
        // !!! this is not triggering reactively !!!
        const filtered = filter(tokens, (t) => playerWithVision(t));
        tokens = new Set(filtered);
    }

    return tokens;
});

export const accessState = {
    ...state,

    activeTokens,

    hasEditAccess: computed(() => {
        if (state.reactive.id === undefined) return false;
        if (gameState.reactive.isDm) return true;
        if (gameState.reactive.isFakePlayer && activeTokens.value.has(state.reactive.id)) return true;
        if (state.reactive.defaultAccess.edit) return true;
        const username = playerSystem.getCurrentPlayer()?.name;
        return [...state.reactive.playerAccess.entries()].some(([u, a]) => u === username && a.edit);
    }),

    owners: computed(() => {
        if (state.reactive.id === undefined) return [];
        return [...state.reactive.playerAccess.keys()];
    }),
};

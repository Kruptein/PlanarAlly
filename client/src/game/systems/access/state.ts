import { computed } from "vue";

import { getGameState } from "../../../store/_game";
import type { LocalId } from "../../id";
import { playerSystem } from "../players";
import { buildState } from "../state";

import { DEFAULT_ACCESS } from "./models";
import type { ShapeAccess } from "./models";

interface AccessState {
    id: LocalId | undefined;
    defaultAccess: ShapeAccess;
    playerAccess: Map<string, ShapeAccess>;

    ownedTokens: Set<LocalId>;
    activeTokenFilters: Set<LocalId> | undefined;
}

const state = buildState<AccessState>({
    id: undefined,
    defaultAccess: DEFAULT_ACCESS,
    playerAccess: new Map(),

    ownedTokens: new Set(),
    activeTokenFilters: undefined,
});

const activeTokens = computed(() => {
    if (state.reactive.activeTokenFilters !== undefined) return state.reactive.activeTokenFilters;
    return state.reactive.ownedTokens;
});

export const accessState = {
    ...state,

    activeTokens,

    hasEditAccess: computed(() => {
        if (state.reactive.id === undefined) return false;
        if (getGameState().isDm) return true;
        if (getGameState().isFakePlayer && activeTokens.value.has(state.reactive.id)) return true;
        if (state.reactive.defaultAccess.edit) return true;
        const username = playerSystem.getCurrentPlayer()?.name;
        return [...state.reactive.playerAccess.entries()].some(([u, a]) => u === username && a.edit === true);
    }),

    owners: computed(() => {
        if (state.reactive.id === undefined) return [];
        return [...state.reactive.playerAccess.keys()];
    }),
};

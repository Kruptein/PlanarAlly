import { computed, reactive, readonly } from "vue";

import { getGameState } from "../../../store/_game";
import { clientStore } from "../../../store/client";
import type { LocalId } from "../../id";

import { DEFAULT_ACCESS } from "./models";
import type { ShapeAccess } from "./models";

interface AccessState {
    id: LocalId | undefined;
    defaultAccess: ShapeAccess;
    playerAccess: Map<string, ShapeAccess>;

    ownedTokens: Set<LocalId>;
    activeTokenFilters: Set<LocalId> | undefined;
}

const state = reactive<AccessState>({
    id: undefined,
    defaultAccess: DEFAULT_ACCESS,
    playerAccess: new Map(),

    ownedTokens: new Set(),
    activeTokenFilters: undefined,
});

const activeTokens = computed(() => {
    if (state.activeTokenFilters !== undefined) return state.activeTokenFilters;
    return state.ownedTokens;
});

export const accessState = {
    $: readonly(state),
    _$: state,

    activeTokens,

    hasEditAccess: computed(() => {
        if (state.id === undefined) return false;
        if (getGameState().isDm) return true;
        if (getGameState().isFakePlayer && activeTokens.value.has(state.id)) return true;
        if (state.defaultAccess.edit) return true;
        const username = clientStore.state.username;
        return [...state.playerAccess.entries()].some(([u, a]) => u === username && a.edit === true);
    }),

    owners: computed(() => {
        if (state.id === undefined) return [];
        return [...state.playerAccess.keys()];
    }),
};

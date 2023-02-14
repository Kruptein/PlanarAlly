import { computed } from "vue";

import { type LocalId } from "../../id";
import { buildState } from "../state";

import type { Group } from "./models";

interface ReactiveGroupState {
    activeId: LocalId | undefined;
    activeGroupId: string | undefined;
}

interface GroupState {
    shapeData: Map<LocalId, { groupId: string | undefined; badge: number }>;
    groups: Map<string, Group>;
    groupMembers: Map<string, Set<LocalId>>;
}

const state = buildState<ReactiveGroupState, GroupState>(
    {
        activeId: undefined,
        activeGroupId: undefined,
    },
    { shapeData: new Map(), groups: new Map(), groupMembers: new Map() },
);

export const groupState = {
    ...state,
    activeGroup: computed(() => {
        const groupId = state.reactive.activeGroupId;
        if (groupId === undefined) return undefined;
        return state.readonly.groups.get(groupId);
    }),
};

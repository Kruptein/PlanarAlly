import { type LocalId } from "../../../core/id";
import { buildState } from "../../../core/systems/state";

import type { Group } from "./models";

interface ReactiveGroupState {
    activeId: LocalId | undefined;
    groupInfo: (Group & { badges: Map<LocalId, string> }) | undefined;
}

interface GroupState {
    shapeData: Map<LocalId, { groupId: string | undefined; badge: number }>;
    groups: Map<string, Group>;
    groupMembers: Map<string, Set<LocalId>>;
}

const state = buildState<ReactiveGroupState, GroupState>(
    {
        activeId: undefined,
        groupInfo: undefined,
    },
    { shapeData: new Map(), groups: new Map(), groupMembers: new Map() },
);

export const groupState = {
    ...state,
};

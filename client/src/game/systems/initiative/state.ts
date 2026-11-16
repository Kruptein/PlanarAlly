import type { GlobalId, LocalId } from "../../../core/id";
import { buildState } from "../../../core/systems/state";

import { type InitiativeData, InitiativeSort } from "./models";

interface ReactiveInitiativeState {
    manuallyOpened: boolean;
    showInitiative: boolean;
    locationData: InitiativeData[];
    newData: InitiativeData[];

    roundCounter: number;
    turnCounter: number;
    sort: InitiativeSort;

    editLock: GlobalId | undefined;

    isActive: boolean;
}

interface InitiativeState {
    // The vision filters that were active before initiative vision lock took over
    activeTokensBackup: Set<LocalId> | undefined;
}

const state = buildState<ReactiveInitiativeState, InitiativeState>(
    {
        manuallyOpened: false,
        showInitiative: false,
        locationData: [],
        newData: [],

        roundCounter: 1,
        turnCounter: 0,
        sort: InitiativeSort.Down,

        editLock: undefined,

        isActive: false,
    },
    { activeTokensBackup: undefined },
);

export const initiativeState = {
    ...state,
};

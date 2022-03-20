import type { GlobalId, LocalId } from "../id";

export interface InitiativeData<T = LocalId> {
    shape: T;
    initiative?: number;
    isVisible: boolean;
    isGroup: boolean;
    effects: InitiativeEffect[];
}

export interface InitiativeEffect {
    name: string;
    turns: string;
    highlightsActor: boolean;
}

export enum InitiativeSort {
    Down,
    Up,
    Manual,
}

export type InitiativeSettings = {
    location: number;
    round: number;
    turn: number;
    sort: InitiativeSort;
    data: InitiativeData<GlobalId>[];
};

export enum InitiativeEffectMode {
    ActiveAndHover = "active",
    Always = "always",
}

import type { GlobalId, LocalId } from "../id";

interface CommonInitiativeData {
    initiative?: number;
    isVisible: boolean;
    isGroup: boolean;
    effects: InitiativeEffect[];
}

export interface RawInitiativeData extends CommonInitiativeData {
    shape: GlobalId;
}
export interface InitiativeData extends CommonInitiativeData {
    globalId: GlobalId;
    localId?: LocalId;
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
    data: RawInitiativeData[];
    isActive: boolean;
};

export enum InitiativeEffectMode {
    ActiveAndHover = "active",
    Always = "always",
}

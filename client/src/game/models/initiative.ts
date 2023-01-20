import type { GlobalId, LocalId } from "../id";

interface CommonInitiativeData {
    initiative?: number;
    isVisible: boolean;
    isGroup: boolean;
    effects: InitiativeEffect[];
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

export enum InitiativeEffectMode {
    ActiveAndHover = "active",
    Always = "always",
}

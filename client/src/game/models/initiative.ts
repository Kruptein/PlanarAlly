import type { GlobalId, LocalId } from "../../core/id";

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
    turns: string | null;
    highlightsActor: boolean;
    updateTiming: InitiativeEffectUpdateTiming;
}

export enum InitiativeEffectUpdateTiming {
    TurnEnd = 0,
    TurnStart = 1,
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

export enum InitiativeTurnDirection {
    Backward = -1,
    Null = 0,
    Forward = 1,
}

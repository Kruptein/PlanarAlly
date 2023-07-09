import type { ApiCharacter } from "../../../apiTypes";
import type { LocalId } from "../../id";
import { buildState } from "../state";

interface ReactiveCharacterState {
    activeCharacterId: number | undefined;
    characterIds: Set<number>;
}

interface CharacterState {
    characterShapes: Map<number, Set<LocalId>>;
    characters: Map<number, ApiCharacter>;
}

const state = buildState<ReactiveCharacterState, CharacterState>(
    { activeCharacterId: undefined, characterIds: new Set() },
    { characters: new Map(), characterShapes: new Map() },
);

export const characterState = {
    ...state,
};

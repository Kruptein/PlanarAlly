import type { ApiCharacter } from "../../../apiTypes";
import type { LocalId } from "../../id";
import { buildState } from "../state";

import type { CharacterId } from "./models";

interface ReactiveCharacterState {
    activeCharacterId: CharacterId | undefined;
    characterIds: Set<CharacterId>;
}

interface CharacterState {
    characterShapes: Map<CharacterId, Set<LocalId>>;
    characters: Map<CharacterId, ApiCharacter>;
}

const state = buildState<ReactiveCharacterState, CharacterState>(
    { activeCharacterId: undefined, characterIds: new Set() },
    { characters: new Map(), characterShapes: new Map() },
);

export const characterState = {
    ...state,
};

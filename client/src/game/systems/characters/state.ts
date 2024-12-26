import type { ApiCharacter } from "../../../apiTypes";
import { buildState } from "../../../core/systems/state";

import type { CharacterId } from "./models";

interface ReactiveCharacterState {
    activeCharacterId: CharacterId | undefined;
    characterIds: Set<CharacterId>;
}

interface CharacterState {
    characters: Map<CharacterId, ApiCharacter>;
}

const state = buildState<ReactiveCharacterState, CharacterState>(
    { activeCharacterId: undefined, characterIds: new Set() },
    { characters: new Map() },
);

export const characterState = {
    ...state,
};

import type { ApiCharacter } from "../../../apiTypes";
import { buildState } from "../../../core/systems/state";

import type { CharacterId } from "./models";

interface ReactiveCharacterState {
    activeCharacterId: CharacterId | undefined;
    characters: Map<CharacterId, ApiCharacter>;
}

const state = buildState<ReactiveCharacterState>({ activeCharacterId: undefined, characters: new Map() });

export const characterState = {
    ...state,
};

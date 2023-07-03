import type { ApiCharacter } from "../../../apiTypes";
import type { LocalId } from "../../id";
import { buildState } from "../state";

interface CharacterState {
    characterShapes: Map<number, Set<LocalId>>;
    characters: Map<number, ApiCharacter>;
}

const state = buildState<object, CharacterState>({}, { characters: new Map(), characterShapes: new Map() });

export const characterState = {
    ...state,
};

import type { ApiCharacter, CharacterLink } from "../../../apiTypes";
import { socket } from "../../api/socket";
import { getLocalId } from "../../id";

import { characterState } from "./state";

import { characterSystem } from ".";

socket.on("Characters.Set", (characters: ApiCharacter[]) => {
    for (const char of characters) {
        characterSystem.addCharacter(char);
    }
});

socket.on("Character.Created", (char: ApiCharacter) => {
    characterState.mutableReactive.characterIds.add(char.id);
    characterState.mutable.characters.set(char.id, char);
    characterState.mutable.characterShapes.set(char.id, new Set());
});

socket.on("Character.Link", (link: CharacterLink) => {
    const id = getLocalId(link.shape);
    if (id !== undefined) {
        const char = characterState.mutable.characters.get(link.character);
        if (char !== undefined) {
            characterSystem.inform(id, char.id);
        }
    }
});

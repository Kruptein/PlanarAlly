import type { ApiCharacter } from "../../../apiTypes";
import { socket } from "../../api/socket";

import type { CharacterId } from "./models";

import { characterSystem } from ".";

socket.on("Characters.Set", (characters: ApiCharacter[]) => {
    for (const char of characters) {
        characterSystem.addCharacter(char);
    }
});

socket.on("Character.Created", (char: ApiCharacter) => {
    characterSystem.addCharacter(char);
});

socket.on("Character.Removed", (charId: CharacterId) => {
    characterSystem.removeCharacter(charId);
});

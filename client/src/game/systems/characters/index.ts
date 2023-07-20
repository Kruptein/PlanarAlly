import { watchEffect, type DeepReadonly } from "vue";

import { registerSystem } from "..";
import type { ShapeSystem } from "..";
import type { ApiCharacter } from "../../../apiTypes";
import { find } from "../../../core/iter";
import { type LocalId } from "../../id";
import { selectedState } from "../selected/state";

import type { CharacterId } from "./models";
import { characterState } from "./state";

const { mutable, readonly, mutableReactive: $ } = characterState;

class CharacterSystem implements ShapeSystem {
    // BEHAVIOUR

    clear(partial: boolean): void {
        $.activeCharacterId = undefined;
        mutable.characterShapes.clear(); // LocalIds change between location changes
        if (!partial) {
            $.characterIds.clear();
            mutable.characters.clear();
        }
    }

    // Inform the system about the state of a certain LocalId
    inform(id: LocalId, characterId: CharacterId): void {
        mutable.characterShapes.set(characterId, id);
        if (selectedState.raw.selected.has(id)) $.activeCharacterId = characterId;
    }

    drop(id: LocalId): void {
        for (const [characterId, shape] of mutable.characterShapes.entries()) {
            if (shape === id) {
                mutable.characterShapes.delete(characterId);
            }
        }
    }

    loadState(id: LocalId): void {
        $.activeCharacterId = find(readonly.characterShapes.entries(), ([, shape]) => shape === id)?.[0];
    }

    dropState(): void {
        $.activeCharacterId = undefined;
    }

    addCharacter(character: ApiCharacter): void {
        $.characterIds.add(character.id);
        mutable.characters.set(character.id, character);
    }

    getAllCharacters(): IterableIterator<DeepReadonly<ApiCharacter>> {
        return readonly.characters.values();
    }

    getShape(characterId: CharacterId): LocalId | undefined {
        return readonly.characterShapes.get(characterId);
    }
}

export const characterSystem = new CharacterSystem();
registerSystem("characters", characterSystem, true, characterState);

watchEffect(() => {
    const id = selectedState.reactive.focus;
    if (id) {
        characterSystem.loadState(id);
    } else characterSystem.dropState();
});

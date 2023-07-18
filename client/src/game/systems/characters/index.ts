import { watchEffect, type DeepReadonly } from "vue";

import { registerSystem } from "..";
import type { ShapeSystem } from "..";
import type { ApiCharacter } from "../../../apiTypes";
import { find } from "../../../core/iter";
import { type LocalId } from "../../id";
import { selectedSystem } from "../selected";

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
        mutable.characterShapes.get(characterId)?.add(id);
        if (selectedSystem.$.value.has(id)) $.activeCharacterId = characterId;
    }

    drop(id: LocalId): void {
        for (const [characterId, shapes] of mutable.characterShapes.entries()) {
            shapes.delete(id);
            if (shapes.size === 0) {
                mutable.characters.delete(characterId);
                mutable.characterShapes.delete(characterId);
            }
        }
    }

    loadState(id: LocalId): void {
        $.activeCharacterId = find(readonly.characterShapes.entries(), ([, shapes]) => shapes.has(id))?.[0];
    }

    dropState(): void {
        $.activeCharacterId = undefined;
    }

    addCharacter(character: ApiCharacter): void {
        $.characterIds.add(character.id);
        mutable.characters.set(character.id, character);
        mutable.characterShapes.set(character.id, new Set());
    }

    getAllCharacters(): IterableIterator<DeepReadonly<ApiCharacter>> {
        return readonly.characters.values();
    }

    getShapes(characterId: CharacterId): ReadonlySet<LocalId> | undefined {
        return readonly.characterShapes.get(characterId);
    }
}

export const characterSystem = new CharacterSystem();
registerSystem("characters", characterSystem, true, characterState);

watchEffect(() => {
    const id = selectedSystem.getFocus();
    if (id.value) {
        characterSystem.loadState(id.value);
    } else characterSystem.dropState();
});

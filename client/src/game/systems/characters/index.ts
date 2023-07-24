import { watchEffect, type DeepReadonly } from "vue";

import { registerSystem } from "..";
import type { ShapeSystem } from "..";
import type { ApiCharacter } from "../../../apiTypes";
import { find } from "../../../core/iter";
import { getGlobalId, getLocalId, getShape, type LocalId } from "../../id";
import type { IShape } from "../../interfaces/shape";
import { selectedState } from "../selected/state";

import type { CharacterId } from "./models";
import { characterState } from "./state";

const { mutable, readonly, mutableReactive: $ } = characterState;

class CharacterSystem implements ShapeSystem {
    // BEHAVIOUR

    clear(partial: boolean): void {
        $.activeCharacterId = undefined;
        if (!partial) {
            $.characterIds.clear();
            mutable.characters.clear();
        }
    }

    // Inform the system about the state of a certain LocalId
    inform(id: LocalId, characterId: CharacterId): void {
        if (selectedState.raw.selected.has(id)) $.activeCharacterId = characterId;
    }

    drop(_id: LocalId): void {}

    loadState(id: LocalId): void {
        $.activeCharacterId = find(readonly.characters.entries(), ([, char]) => char.shapeId === getGlobalId(id))?.[0];
    }

    dropState(): void {
        $.activeCharacterId = undefined;
    }

    addCharacter(character: ApiCharacter): void {
        $.characterIds.add(character.id);
        mutable.characters.set(character.id, character);
    }

    removeCharacter(characterId: CharacterId): void {
        if ($.activeCharacterId === characterId) $.activeCharacterId = undefined;
        $.characterIds.delete(characterId);
        const shape = this.getShape(characterId);
        if (shape) {
            shape.character = undefined;
        }
        mutable.characters.delete(characterId);
    }

    getAllCharacters(): IterableIterator<DeepReadonly<ApiCharacter>> {
        return readonly.characters.values();
    }

    getShape(character: CharacterId): IShape | undefined {
        const shapeId = mutable.characters.get(character)?.shapeId;
        if (shapeId) {
            const localId = getLocalId(shapeId, false);
            if (localId) return getShape(localId);
        }
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

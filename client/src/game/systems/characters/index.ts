import { type DeepReadonly, watch } from "vue";

import type { ApiCharacter } from "../../../apiTypes";
import type { GlobalId, LocalId } from "../../../core/id";
import { find } from "../../../core/iter";
import { registerSystem } from "../../../core/systems";
import type { System, SystemClearReason } from "../../../core/systems/models";
import { getGlobalId, getLocalId, getShape } from "../../id";
import type { IShape } from "../../interfaces/shape";
import { selectedState } from "../selected/state";

import type { CharacterId } from "./models";
import { characterState } from "./state";

const { raw, mutableReactive: $ } = characterState;

class CharacterSystem implements System {
    // CORE

    clear(reason: SystemClearReason): void {
        $.activeCharacterId = undefined;
        if (reason !== "partial-loading") {
            $.characters.clear();
        }
    }

    // REACTIVE

    loadState(id: LocalId): void {
        $.activeCharacterId = find(raw.characters.entries(), ([, char]) => char.shapeId === getGlobalId(id))?.[0];
    }

    dropState(): void {
        $.activeCharacterId = undefined;
    }

    // BEHAVIOUR

    addCharacter(character: ApiCharacter): void {
        $.characters.set(character.id, character);

        // Link the local shape to its character (e.g. when a character was just created)
        const shape = this.getShape(character.id);
        if (shape) shape.character = character.id;

        checkSelectedForCharacterState(selectedState.reactive.focus);
    }

    removeCharacter(characterId: CharacterId): void {
        if ($.activeCharacterId === characterId) $.activeCharacterId = undefined;
        const shape = this.getShape(characterId);
        if (shape) {
            shape.character = undefined;
        }
        $.characters.delete(characterId);
    }

    setName(characterId: CharacterId, name: string): void {
        const character = $.characters.get(characterId);
        if (character) character.name = name;
    }

    getAllCharacters(): IterableIterator<DeepReadonly<ApiCharacter>> {
        return raw.characters.values();
    }

    getShape(character: CharacterId): IShape | undefined {
        const shapeId = raw.characters.get(character)?.shapeId;
        if (shapeId) {
            const localId = getLocalId(shapeId, false);
            if (localId) {
                return getShape(localId);
            }
        }
    }

    getShapeId(character: CharacterId): GlobalId | undefined {
        return raw.characters.get(character)?.shapeId;
    }
}

export const characterSystem = new CharacterSystem();
registerSystem("characters", characterSystem, false, characterState);

function checkSelectedForCharacterState(shapeId: LocalId | undefined): void {
    if (shapeId) characterSystem.loadState(shapeId);
    else characterSystem.dropState();
}

watch(() => selectedState.reactive.focus, checkSelectedForCharacterState);

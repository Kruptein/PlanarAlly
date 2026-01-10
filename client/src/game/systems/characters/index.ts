import { type DeepReadonly, watch } from "vue";

import type { ApiCharacter } from "../../../apiTypes";
import type { GlobalId, LocalId } from "../../../core/id";
import { find } from "../../../core/iter";
import { registerSystem } from "../../../core/systems";
import type { System, SystemClearReason } from "../../../core/systems/models";
import { getGlobalId, getLocalId, getVisualShape } from "../../id";
import type { IShape } from "../../interfaces/shape";
import type { IToggleComposite } from "../../interfaces/shapes/toggleComposite";
import { selectedState } from "../selected/state";

import type { CharacterId } from "./models";
import { characterState } from "./state";

const { mutable, readonly, mutableReactive: $ } = characterState;

class CharacterSystem implements System {
    // CORE

    clear(reason: SystemClearReason): void {
        $.activeCharacterId = undefined;
        if (reason !== "partial-loading") {
            $.characterIds.clear();
            mutable.characters.clear();
        }
    }

    // REACTIVE

    loadState(id: LocalId): void {
        $.activeCharacterId = find(readonly.characters.entries(), ([, char]) => char.shapeId === getGlobalId(id))?.[0];
    }

    dropState(): void {
        $.activeCharacterId = undefined;
    }

    // BEHAVIOUR

    addCharacter(character: ApiCharacter): void {
        $.characterIds.add(character.id);
        mutable.characters.set(character.id, character);

        checkSelectedForCharacterState(selectedState.reactive.focus);
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
            if (localId) {
                return getVisualShape(localId);
            }
        }
    }

    getShapeId(character: CharacterId): GlobalId | undefined {
        return mutable.characters.get(character)?.shapeId;
    }
}

export const characterSystem = new CharacterSystem();
registerSystem("characters", characterSystem, false, characterState);

function checkSelectedForCharacterState(shapeId: LocalId | undefined): void {
    if (shapeId) characterSystem.loadState(shapeId);
    else characterSystem.dropState();
}

watch(() => selectedState.reactive.focus, checkSelectedForCharacterState);

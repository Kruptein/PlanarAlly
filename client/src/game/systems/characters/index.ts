import { type DeepReadonly, watch } from "vue";

import type { ApiCharacter } from "../../../apiTypes";
import type { LocalId } from "../../../core/id";
import { find } from "../../../core/iter";
import { registerSystem } from "../../../core/systems";
import type { ShapeSystem } from "../../../core/systems";
import type { SystemClearReason } from "../../../core/systems/models";
import { getGlobalId, getLocalId, getShape } from "../../id";
import type { IShape } from "../../interfaces/shape";
import type { IToggleComposite } from "../../interfaces/shapes/toggleComposite";
import { selectedState } from "../selected/state";

import type { CharacterId } from "./models";
import { characterState } from "./state";

const { mutable, readonly, mutableReactive: $ } = characterState;

class CharacterSystem implements ShapeSystem {
    // BEHAVIOUR

    clear(reason: SystemClearReason): void {
        $.activeCharacterId = undefined;
        if (reason !== "partial-loading") {
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
                const shape = getShape(localId);
                if (shape === undefined) return undefined;
                if (shape.type === "togglecomposite") {
                    return getShape((shape as IToggleComposite).activeVariant);
                }
                return shape;
            }
        }
    }
}

export const characterSystem = new CharacterSystem();
registerSystem("characters", characterSystem, true, characterState);

function checkSelectedForCharacterState(shapeId: LocalId | undefined): void {
    if (shapeId) characterSystem.loadState(shapeId);
    else characterSystem.dropState();
}

watch(() => selectedState.reactive.focus, checkSelectedForCharacterState);

import type { DeepReadonly } from "vue";

import { registerSystem } from "..";
import type { ShapeSystem } from "..";
import type { ApiCharacter } from "../../../apiTypes";
import type { LocalId } from "../../id";

import { characterState } from "./state";

const { mutable, readonly } = characterState;

class CharacterSystem implements ShapeSystem {
    // BEHAVIOUR

    clear(): void {
        mutable.characters.clear();
        mutable.characterShapes.clear();
    }

    // Inform the system about the state of a certain LocalId
    inform(id: LocalId, data: ApiCharacter): void {
        mutable.characters.set(data.id, data);
        if (!mutable.characterShapes.has(data.id)) {
            mutable.characterShapes.set(data.id, new Set());
        }
        mutable.characterShapes.get(data.id)!.add(id);
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

    getAllCharacters(): IterableIterator<DeepReadonly<ApiCharacter>> {
        return readonly.characters.values();
    }

    getShapes(characterId: number): ReadonlySet<LocalId> | undefined {
        return readonly.characterShapes.get(characterId);
    }
}

export const characterSystem = new CharacterSystem();
registerSystem("characters", characterSystem, true, characterState);

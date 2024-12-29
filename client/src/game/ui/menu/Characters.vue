<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

import { getImageSrcFromHash } from "../../../assets/utils";
import { useModal } from "../../../core/plugins/modals/plugin";
import { setCenterPosition } from "../../position";
import { characterSystem } from "../../systems/characters";
import { sendRemoveCharacter } from "../../systems/characters/emits";
import type { CharacterId } from "../../systems/characters/models";
import { characterState } from "../../systems/characters/state";
import { gameState } from "../../systems/game/state";

const { t } = useI18n();

const modals = useModal();

const characterId = ref<CharacterId | undefined>(undefined);

const charAsset = computed(() => {
    if (characterId.value === undefined) return undefined;

    const char = characterState.readonly.characters.get(characterId.value);
    if (char === undefined) return undefined;

    return { assetHash: char.assetHash, assetId: char.assetId };
});

function dragStart(event: DragEvent): void {
    if (!gameState.isDmOrFake.value) return;
    if (event.dataTransfer === null) return;
    if (charAsset.value === undefined) return;
    const { assetHash, assetId } = charAsset.value;

    event.dataTransfer.setDragImage(new Image(), 0, 0);
    event.dataTransfer.setData("text/plain", JSON.stringify({ assetHash, assetId, characterId: characterId.value }));

    characterId.value = undefined;
}

function focus(characterId: CharacterId): void {
    const shape = characterSystem.getShape(characterId);
    if (shape) setCenterPosition(shape.center);
}

async function remove(characterId: CharacterId): Promise<void> {
    const name = characterState.readonly.characters.get(characterId)?.name ?? "??";
    const confirmed = await modals.confirm("Character Removal", `Are you sure you wish to remove character ${name}?`);
    if (confirmed ?? false) {
        sendRemoveCharacter(characterId);
    }
}
</script>

<template>
    <button class="menu-accordion">{{ t("game.ui.menu.MenuBar.characters") }}</button>
    <div class="menu-accordion-panel">
        <div class="menu-accordion-subpanel" style="position: relative">
            <div
                v-for="char in characterState.reactive.characterIds"
                :key="char"
                class="character"
                :draggable="gameState.isDmOrFake.value"
                @dragstart="dragStart"
                @mouseover="characterId = char"
                @mouseout="characterId = undefined"
                @click="focus(char)"
            >
                {{ characterState.readonly.characters.get(char)?.name ?? "??" }}
                <span class="remove" title="Remove character" @click.stop="remove(char)">X</span>
            </div>
            <div v-if="!characterState.reactive.characterIds.size">{{ t("game.ui.menu.MenuBar.no_characters") }}</div>
            <div v-if="charAsset !== undefined" class="preview">
                <img class="asset-preview-image" :src="getImageSrcFromHash(charAsset.assetHash)" alt="" />
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.preview {
    position: fixed;
    left: 200px;
    top: 0;
}

.asset-preview-image {
    width: 100%;
    max-width: 250px;
}

.character {
    position: relative;

    &:hover {
        cursor: pointer;
    }

    .remove {
        position: absolute;
        right: 1rem;

        &:hover {
            font-weight: bold;
        }
    }
}
</style>

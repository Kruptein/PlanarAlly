<script setup lang="ts">
import { computed, ref } from "vue";

import { baseAdjust } from "../../../core/http";
import type { CharacterId } from "../../systems/characters/models";
import { characterState } from "../../systems/characters/state";
import { gameState } from "../../systems/game/state";

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
</script>

<template>
    <button class="menu-accordion">Characters</button>
    <div class="menu-accordion-panel">
        <div class="menu-accordion-subpanel" style="position: relative">
            <div
                v-for="char in characterState.reactive.characterIds"
                :key="char"
                style="cursor: pointer"
                :draggable="gameState.isDmOrFake.value"
                @dragstart="dragStart"
                @mouseover="characterId = char"
                @mouseout="characterId = undefined"
            >
                {{ characterState.readonly.characters.get(char)?.name ?? "??" }}
            </div>
            <div v-if="!characterState.reactive.characterIds.size">No characters</div>
            <div v-if="charAsset !== undefined" class="preview">
                <img class="asset-preview-image" :src="baseAdjust('/static/assets/' + charAsset.assetHash)" alt="" />
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
</style>

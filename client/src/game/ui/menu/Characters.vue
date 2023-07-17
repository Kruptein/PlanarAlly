<script setup lang="ts">
import { computed, ref } from "vue";

import { baseAdjust } from "../../../core/http";
import { getShape } from "../../id";
import type { IAsset } from "../../interfaces/shapes/asset";
import { characterSystem } from "../../systems/characters";
import { characterState } from "../../systems/characters/state";

const characterId = ref<number | undefined>(undefined);

const charAsset = computed(() => {
    if (characterId.value === undefined) return undefined;

    const char = [...(characterSystem.getShapes(characterId.value) ?? [])].at(0)!;
    const shape = getShape(char) as IAsset;
    if (shape === undefined || shape.assetId === undefined || shape.type !== "assetrect") return;

    const assetHash = shape.src.split("/").at(-1)!;
    return { assetHash, assetId: shape.assetId };
});

function dragStart(event: DragEvent): void {
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
                draggable="true"
                @dragstart="dragStart"
                @mouseover="characterId = char"
                @mouseout="characterId = undefined"
            >
                {{ characterState.readonly.characters.get(char)?.name }}
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

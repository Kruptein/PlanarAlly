<script setup lang="ts">
import { computed, toRef } from "vue";

import { cloneP } from "../../../../core/geometry";
import { InvalidationMode, SERVER_SYNC, SyncMode } from "../../../../core/models/types";
import { useModal } from "../../../../core/plugins/modals/plugin";
import { activeShapeStore } from "../../../../store/activeShape";
import { getShape } from "../../../id";
import type { LocalId } from "../../../id";
import { compositeState } from "../../../layers/state";
import { ToggleComposite } from "../../../shapes/variants/toggleComposite";
import { dropAsset } from "../../../temp";

const modals = useModal();

const vState = activeShapeStore.state;

const currentIndex = computed(() => vState.variants.findIndex((v) => v.uuid === vState.id));

const previousVariant = computed(() => {
    if (currentIndex.value < 0) return { name: "No variant" };
    return vState.variants[(currentIndex.value + vState.variants.length - 1) % vState.variants.length];
});

const currentVariant = computed(() => {
    if (currentIndex.value < 0) return "No variant";
    return vState.variants[currentIndex.value].name;
});

const nextVariant = computed(() => {
    if (currentIndex.value < 0) return { name: "No variant" };
    return vState.variants[(currentIndex.value + 1) % vState.variants.length];
});

const compositeParent = computed(() => {
    if (vState.id === undefined) return undefined;
    return compositeState.getCompositeParent(vState.id);
});

function activateVariant(variant: LocalId): void {
    const parent = compositeState.getCompositeParent(variant)!;
    parent.setActiveVariant(variant, true);
}

function swapPrev(): void {
    if ("uuid" in previousVariant.value) {
        activateVariant(previousVariant.value.uuid);
    }
}

function swapNext(): void {
    if ("uuid" in nextVariant.value) {
        activateVariant(nextVariant.value.uuid);
    }
}

async function addVariant(): Promise<void> {
    const asset = await modals.assetPicker();
    if (asset === undefined) return;

    const shape = getShape(vState.id!)!;

    const newShape = await dropAsset(
        { imageSource: `/static/assets/${asset.file_hash}`, assetId: asset.id },
        { x: shape.refPoint.x, y: shape.refPoint.y },
    );
    if (newShape === undefined) return;

    const name = await modals.prompt("What name should this variant have?", "Name variant");
    if (name === undefined) return;

    let parent = compositeParent.value;
    if (parent === undefined) {
        parent = new ToggleComposite(cloneP(shape.refPoint), shape.id, [{ uuid: shape.id, name: "base variant" }]);
        shape.layer.addShape(parent, SyncMode.FULL_SYNC, InvalidationMode.NO);
    }
    parent.addVariant(newShape.id, name, true);
    parent.setActiveVariant(newShape.id, true);
}

async function renameVariant(): Promise<void> {
    if (vState.parentUuid === undefined) return;

    const name = await modals.prompt("What name should this variant have?", "Name variant");
    if (name === undefined) return;

    activeShapeStore.renameVariant(vState.id!, name, SERVER_SYNC);
}

async function removeVariant(): Promise<void> {
    if (vState.parentUuid === undefined) return;

    const remove = await modals.confirm(
        `Remove ${currentVariant.value}`,
        "Are you sure you wish to remove the current variant?",
    );
    if (remove !== true) return;

    activeShapeStore.removeVariant(vState.id!, SERVER_SYNC);
}

const variants = toRef(vState, "variants");
</script>

<template>
    <div id="variant-switcher">
        <font-awesome-icon
            id="variant-left"
            icon="chevron-left"
            @click="swapPrev"
            :title="previousVariant.name"
            :style="{ opacity: variants.length > 1 ? '1.0' : '0.3' }"
        />
        <div id="variant-name">{{ currentVariant }}</div>
        <font-awesome-icon
            icon="chevron-right"
            @click="swapNext"
            :title="nextVariant.name"
            :style="{ opacity: variants.length > 1 ? '1.0' : '0.3' }"
        />
        <font-awesome-icon id="add-variant" icon="plus-square" title="Add a variant" @click="addVariant" />
        <font-awesome-icon
            icon="pencil-alt"
            title="Edit variant name"
            @click="renameVariant"
            :style="{ opacity: compositeParent !== undefined ? '1.0' : '0.3' }"
        />
        <font-awesome-icon
            icon="trash-alt"
            title="Remove variant"
            @click="removeVariant"
            :style="{ opacity: compositeParent !== undefined ? '1.0' : '0.3' }"
        />
    </div>
</template>

<style lang="scss" scoped>
#variant-switcher {
    background-color: white;
    padding: 5px;
    padding-bottom: 10px;
    display: grid;
    grid-template-columns: 1fr 30px auto 30px 1fr 20px 20px 20px;
    justify-items: center;
    align-items: center;

    #variant-name {
        padding: 0 15px;
    }

    #variant-left {
        grid-column-start: 2;
    }

    #add-variant {
        grid-column-start: 6;
    }
}
</style>

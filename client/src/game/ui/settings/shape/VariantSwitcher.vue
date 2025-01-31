<script setup lang="ts">
import { computed, toRef } from "vue";
import { useToast } from "vue-toastification";

import { assetState } from "../../../../assets/state";
import { getImageSrcFromHash } from "../../../../assets/utils";
import { cloneP } from "../../../../core/geometry";
import type { LocalId } from "../../../../core/id";
import { InvalidationMode, SERVER_SYNC, SyncMode } from "../../../../core/models/types";
import { useModal } from "../../../../core/plugins/modals/plugin";
import { activeShapeStore } from "../../../../store/activeShape";
import { dropAsset } from "../../../dropAsset";
import { getShape } from "../../../id";
import { compositeState } from "../../../layers/state";
import { ToggleComposite } from "../../../shapes/variants/toggleComposite";
import { pickAsset } from "../../../systems/assets/ui";

const modals = useModal();
const toast = useToast();

const vState = activeShapeStore.state;

const currentIndex = computed(() => vState.variants.findIndex((v) => v.id === vState.id));

const previousVariant = computed(() => {
    if (currentIndex.value < 0) return { name: "No variant" };
    return vState.variants[(currentIndex.value + vState.variants.length - 1) % vState.variants.length]!;
});

const currentVariant = computed(() => {
    if (currentIndex.value < 0) return "No variant";
    return vState.variants[currentIndex.value]!.name;
});

const nextVariant = computed(() => {
    if (currentIndex.value < 0) return { name: "No variant" };
    return vState.variants[(currentIndex.value + 1) % vState.variants.length]!;
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
    if ("id" in previousVariant.value) {
        activateVariant(previousVariant.value.id);
    }
}

function swapNext(): void {
    if ("id" in nextVariant.value) {
        activateVariant(nextVariant.value.id);
    }
}

async function addVariant(): Promise<void> {
    const assetId = await pickAsset();
    if (assetId === null) return;

    const assetInfo = assetState.raw.idMap.get(assetId);
    if (assetInfo === undefined || assetInfo.fileHash === null) return;

    const shape = getShape(vState.id!)!;

    if (assetInfo.fileHash === null) {
        console.error("Missing fileHash for new variant");
        return;
    }

    const name = await modals.prompt("What name should this variant have?", "Name variant");
    if (name === undefined) return;

    const newShape = await dropAsset(
        { imageSource: getImageSrcFromHash(assetInfo.fileHash, { addBaseUrl: false }), assetId: assetId },
        shape.refPoint,
    );
    if (newShape === undefined) {
        toast.error("Something went wrong trying to add this variant.");
        return;
    }

    let parent = compositeParent.value;
    if (parent === undefined) {
        parent = new ToggleComposite(cloneP(shape.refPoint), shape.id, [{ id: shape.id, name: "base variant" }]);
        shape.layer?.addShape(parent, SyncMode.FULL_SYNC, InvalidationMode.NO);
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
            :title="previousVariant.name"
            :style="{ opacity: variants.length > 1 ? '1.0' : '0.3' }"
            @click="swapPrev"
        />
        <div id="variant-name">{{ currentVariant }}</div>
        <font-awesome-icon
            icon="chevron-right"
            :title="nextVariant.name"
            :style="{ opacity: variants.length > 1 ? '1.0' : '0.3' }"
            @click="swapNext"
        />
        <font-awesome-icon id="add-variant" icon="plus-square" title="Add a variant" @click.stop="addVariant" />
        <font-awesome-icon
            icon="pencil-alt"
            title="Edit variant name"
            :style="{ opacity: compositeParent !== undefined ? '1.0' : '0.3' }"
            @click="renameVariant"
        />
        <font-awesome-icon
            icon="trash-alt"
            title="Remove variant"
            :style="{ opacity: compositeParent !== undefined ? '1.0' : '0.3' }"
            @click="removeVariant"
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

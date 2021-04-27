<script lang="ts">
import { computed, defineComponent, toRef } from "vue";

import { Asset as A, InvalidationMode, SyncMode, SyncTo } from "../../../../core/models/types";
import { useModal } from "../../../../core/plugins/modals/plugin";
import { activeShapeStore } from "../../../../store/activeShape";
import { UuidMap } from "../../../../store/shapeMap";
import { compositeState } from "../../../layers/state";
import { ToggleComposite } from "../../../shapes/variants/toggleComposite";
import { dropAsset } from "../../../temp";

export default defineComponent({
    setup() {
        const modals = useModal();

        const vState = activeShapeStore.state;

        const currentIndex = computed(() => vState.variants.findIndex((v) => v.uuid === vState.uuid));

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
            if (vState.uuid === undefined) return undefined;
            return compositeState.getCompositeParent(vState.uuid);
        });

        function activateVariant(variant: string): void {
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
            const asset = undefined as A | undefined; // await this.$refs.assetPicker.open();
            if (asset === undefined) return;

            const shape = UuidMap.get(vState.uuid!)!;

            const newShape = await dropAsset(
                { imageSource: `/static/assets/${asset.file_hash}`, assetId: asset.id },
                { x: shape.refPoint.x, y: shape.refPoint.y },
            );
            if (newShape === undefined) return;

            const name = await modals.prompt("What name should this variant have?", "Name variant");
            if (name === undefined) return;

            let parent = compositeParent.value;
            if (parent === undefined) {
                parent = new ToggleComposite(shape.refPoint.clone(), shape.uuid, [
                    { uuid: shape.uuid, name: "base variant" },
                ]);
                shape.layer.addShape(parent, SyncMode.FULL_SYNC, InvalidationMode.NO);
            }
            parent.addVariant(newShape.uuid, name, true);
            parent.setActiveVariant(newShape.uuid, true);
        }

        async function renameVariant(): Promise<void> {
            if (vState.parentUuid === undefined) return;

            const name = await modals.prompt("What name should this variant have?", "Name variant");
            if (name === undefined) return;

            activeShapeStore.renameVariant(vState.uuid!, name, SyncTo.SERVER);
        }

        async function removeVariant(): Promise<void> {
            if (vState.parentUuid === undefined) return;

            const remove = await modals.confirm(
                `Remove ${currentVariant.value}`,
                "Are you sure you wish to remove the current variant?",
            );
            if (remove !== true) return;

            activeShapeStore.removeVariant(vState.uuid!, SyncTo.SERVER);
        }

        return {
            addVariant,
            compositeParent,
            currentVariant,
            nextVariant,
            previousVariant,
            removeVariant,
            renameVariant,
            swapNext,
            swapPrev,
            variants: toRef(vState, "variants"),
        };
    },
});
</script>

<template>
    <div id="variant-switcher">
        <!-- <AssetPicker ref="assetPicker" /> -->
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

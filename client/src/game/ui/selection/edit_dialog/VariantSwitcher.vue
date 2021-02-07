<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import AssetPicker from "@/core/components/modals/AssetPicker.vue";
import ConfirmDialog from "@/core/components/modals/confirm.vue";
import Prompt from "@/core/components/modals/prompt.vue";
import SelectionBox from "@/core/components/modals/SelectionBox.vue";

import { InvalidationMode, SyncMode, SyncTo } from "../../../../core/comm/types";
import { layerManager } from "../../../layers/manager";
import { dropAsset } from "../../../layers/utils";
import { ToggleComposite } from "../../../shapes/variants/togglecomposite";
import { ActiveShapeState, activeShapeStore } from "../../ActiveShapeStore";

@Component({ components: { AssetPicker, ConfirmDialog, Prompt, SelectionBox } })
export default class VariantSwitcher extends Vue {
    $refs!: {
        assetPicker: AssetPicker;
        confirmDialog: ConfirmDialog;
        promptDialog: Prompt;
        selectionBox: SelectionBox;
    };

    get owned(): boolean {
        return activeShapeStore.hasEditAccess;
    }

    get shape(): ActiveShapeState {
        return activeShapeStore;
    }

    get compositeParent(): ToggleComposite | undefined {
        if (this.shape.uuid === undefined) return undefined;
        return layerManager.getCompositeParent(this.shape.uuid);
    }

    get variants(): readonly { uuid: string; name: string }[] {
        return this.shape.variants;
    }

    get currentIndex(): number {
        return this.variants.findIndex((v) => v.uuid === this.shape.uuid);
    }

    get previousVariant(): { uuid?: string; name: string } {
        const index = this.currentIndex;
        if (index < 0) return { name: "No variant" };
        const variants = this.variants;
        return variants[(index + variants.length - 1) % variants.length];
    }

    get currentVariant(): string {
        const index = this.currentIndex;
        if (index < 0) return "No variant";
        return this.variants[index].name;
    }

    get nextVariant(): { uuid?: string; name: string } {
        const index = this.currentIndex;
        if (index < 0) return { name: "No variant" };
        const variants = this.variants;
        return variants[(index + 1) % variants.length];
    }

    swapNext(): void {
        const uuid = this.nextVariant.uuid;
        if (uuid === undefined) return;
        this.activateVariant(uuid);
    }

    swapPrev(): void {
        const uuid = this.previousVariant.uuid;
        if (uuid === undefined) return;
        this.activateVariant(uuid);
    }

    activateVariant(variant: string): void {
        const parent = layerManager.getCompositeParent(variant)!;
        parent.setActiveVariant(variant, true);
    }

    async addVariant(): Promise<void> {
        const asset = await this.$refs.assetPicker.open();
        if (asset === undefined) return;

        const shape = layerManager.UUIDMap.get(this.shape.uuid!)!;

        const newShape = await dropAsset(
            { imageSource: `/static/assets/${asset.file_hash}`, assetId: asset.id },
            { x: shape.refPoint.x, y: shape.refPoint.y },
            this.$refs.selectionBox,
        );
        if (newShape === undefined) return;

        const name = await this.$refs.promptDialog.prompt("What name should this variant have?", "Name variant");
        if (name === undefined) return;

        let parent = this.compositeParent;
        if (parent === undefined) {
            parent = new ToggleComposite(shape.refPoint.clone(), shape.uuid, [
                { uuid: shape.uuid, name: "base variant" },
            ]);
            shape.layer.addShape(parent, SyncMode.FULL_SYNC, InvalidationMode.NO);
        }
        parent.addVariant(newShape.uuid, name, true);
        parent.setActiveVariant(newShape.uuid, true);
    }

    async renameVariant(): Promise<void> {
        if (this.shape.parentUuid === undefined) return;

        const name = await this.$refs.promptDialog.prompt("What name should this variant have?", "Name variant");
        if (name === undefined) return;

        this.shape.renameVariant({ uuid: this.shape.uuid!, name, syncTo: SyncTo.SERVER });
    }

    async removeVariant(): Promise<void> {
        if (this.shape.parentUuid === undefined) return;

        const remove = await this.$refs.confirmDialog.open(
            `Remove ${this.currentVariant}`,
            "Are you sure you wish to remove the current variant?",
        );
        if ((remove ?? false) === false) return;

        this.shape.removeVariant({ uuid: this.shape.uuid!, syncTo: SyncTo.SERVER });
    }
}
</script>

<template>
    <div id="variant-switcher">
        <AssetPicker ref="assetPicker" />
        <ConfirmDialog ref="confirmDialog" />
        <Prompt ref="promptDialog" />
        <SelectionBox ref="selectionBox" />
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

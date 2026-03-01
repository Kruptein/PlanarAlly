<script setup lang="ts">
import { computed, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useModal } from "../../../../core/plugins/modals/plugin";
import { getShape } from "../../../id";
import { selectedState } from "../../../systems/selected/state";
import { pickAsset } from "../../../systems/assets/ui";
import { variantsState } from "../../../systems/variants/state";
import { variantsSystem } from "../../../systems/variants";
import { IAsset } from "../../../interfaces/shapes/asset";
import { propertiesState } from "../../../systems/properties/state";
import { assetState } from "../../../../assets/state";
import { getImageSrcFromHash } from "../../../../assets/utils";

const { t } = useI18n();
const modals = useModal();

watch(
    () => selectedState.reactive.focus,
    (newFocus, oldFocus) => {
        if (newFocus === undefined && oldFocus) variantsSystem.dropState(oldFocus, "variant-properties");
        else if (newFocus) variantsSystem.loadState(newFocus, "variant-properties");
    },
    { immediate: true },
);

const shape = computed(() => getShape(selectedState.reactive.focus!) as IAsset | undefined);

const augmentedVariants = computed(() => variantsState.reactive.data.get(selectedState.reactive.focus!) ?? []);

async function addVariant(): Promise<void> {
    if (!shape.value) return;

    const assetId = await pickAsset();
    if (assetId === null) return;
    const assetInfo = assetState.raw.idMap.get(assetId);
    if (assetInfo === undefined || assetInfo.assetId === null) return;

    variantsSystem.create(shape.value.id, {
        name: null,
        assetId: assetInfo.assetId,
        width: shape.value.w,
        height: shape.value.h,
    });
}

async function removeVariant(variantId: number): Promise<void> {
    if (!shape.value) return;
    const answer = await modals.confirm("Remove variant", "Are you sure you want to remove this variant?");
    if (answer !== true) return;
    variantsSystem.remove(shape.value.id, variantId, true);
}

async function storeVariant(variantId: number): Promise<void> {
    if (!shape.value) return;
    const answer = await modals.confirm(
        "Update variant",
        "Update this variant with the current shape art, name and size?",
    );
    if (answer !== true) return;
    variantsSystem.store(shape.value.id, variantId);
}

function loadVariant(variantId: number): void {
    if (!shape.value) return;
    variantsSystem.load(shape.value.id, variantId);
}

function updateVariantName(variantId: number, name: string): void {
    if (!shape.value) return;
    variantsSystem.update(shape.value.id, { name: name || null, id: variantId }, true);
}

async function storeAsVariant(): Promise<void> {
    if (!shape.value?.assetId) return;
    const name = propertiesState.raw.data.get(shape.value.id)?.name || null;
    variantsSystem.create(shape.value.id, {
        name,
        assetId: shape.value.assetId,
        width: shape.value.w,
        height: shape.value.h,
    });
}
</script>

<template>
    <div id="variant-settings">
        <div v-if="augmentedVariants.length === 0" style="white-space: pre-wrap">
            {{ t("game.ui.selection.edit_dialog.variants.empty") }}
        </div>
        <div v-else>
            <div v-for="variant in augmentedVariants" :key="variant.id" class="variant-row">
                <img :src="getImageSrcFromHash(variant.assetHash)" alt="" loading="lazy" class="variant-image" />
                <input
                    type="text"
                    class="variant-name"
                    :value="variant.name ?? ''"
                    placeholder="empty - no custom name"
                    @change="updateVariantName(variant.id, ($event.target as HTMLInputElement).value)"
                />
                <div class="variant-actions">
                    <button
                        class="primary"
                        @click.stop="loadVariant(variant.id)"
                        title="Load variant data into the shape"
                    >
                        <font-awesome-icon icon="upload" />
                    </button>
                    <div class="action-separator" />
                    <button
                        class="secondary"
                        @click.stop="storeVariant(variant.id)"
                        title="Update variant with current shape art, name and size"
                    >
                        <font-awesome-icon icon="download" />
                    </button>
                    <button class="secondary" @click.stop="removeVariant(variant.id)" title="Remove variant">
                        <font-awesome-icon icon="trash-alt" />
                    </button>
                </div>
            </div>
        </div>
        <div style="flex: 1"></div>
        <div id="root-buttons">
            <button @click.stop="storeAsVariant" :disabled="!shape?.assetId">
                <font-awesome-icon icon="download" />
                {{ t("game.ui.selection.edit_dialog.variants.storeAsVariant") }}
            </button>
            <button @click.stop="addVariant">
                <font-awesome-icon icon="plus" />
                {{ t("game.ui.selection.edit_dialog.variants.addVariant") }}
            </button>
        </div>
    </div>
</template>

<style scoped>
#variant-settings {
    display: flex;
    flex-direction: column;

    padding: 1rem 1rem;
    background-color: white;

    height: 100%;

    max-height: 70vh;
    overflow-y: auto;

    #root-buttons {
        display: flex;
        justify-content: space-between;
        gap: 1rem;

        button {
            display: flex;
            background-color: rgba(255, 168, 191, 0.5);
            border: none;
            padding: 0.5rem;
            margin-top: 1rem;
            cursor: pointer;
            border-radius: 0.5rem;

            &:hover {
                background-color: #ffa8bf;
            }

            svg {
                margin-right: 0.5rem;
            }
        }
    }
}

.variant-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem;
    border-bottom: 1px solid #ccc;

    .variant-image {
        width: 50px;
        height: 50px;
        object-fit: contain;
        flex-shrink: 0;
    }

    .variant-name {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        padding: 0.25rem 0.5rem;
        border: 1px solid #ccc;
        border-radius: 0.25rem;

        &:focus {
            outline: none;
            border-color: #ffa8bf;
        }
    }

    .variant-actions {
        display: flex;
        gap: 0.5rem;
        flex-shrink: 0;
        align-items: center;

        .action-separator {
            width: 1px;
            height: 1.25rem;
            background-color: #ccc;
            margin: 0 0.125rem;
        }

        button.primary {
            background-color: #ffa8bf;
            border: none;
            padding: 0.5rem;
            cursor: pointer;
            border-radius: 0.25rem;

            &:hover {
                background-color: #ff8fad;
            }
        }

        button.secondary {
            background-color: transparent;
            border: 1px solid #ddd;
            padding: 0.5rem;
            cursor: pointer;
            border-radius: 0.25rem;
            color: #888;

            &:hover {
                background-color: rgba(255, 168, 191, 0.3);
                color: inherit;
            }
        }
    }
}
</style>

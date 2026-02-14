<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { AssetId } from "../../../../assets/models";
import { getImageSrcFromAssetId } from "../../../../assets/utils";
import { getShape } from "../../../id";
import { Asset } from "../../../shapes/variants/asset";
import { selectedState } from "../../../systems/selected/state";
import { pickAsset } from "../../../systems/assets/ui";
import { propertiesSystem } from "../../../systems/properties";
import { SERVER_SYNC } from "../../../../core/models/types";

const { t } = useI18n();

const shape = computed(() => getShape(selectedState.reactive.focus!) as Asset | undefined);

const augmentedVariants = computed(() =>
    shape.value?.variants.map((v) => ({ ...v, src: getImageSrcFromAssetId(v.assetId) })),
);

async function addVariant(): Promise<void> {
    if (!shape.value) return;

    const assetId = await pickAsset();
    if (assetId === null) return;

    // Add current version as a variant if there are no entries yet
    if (shape.value.variants.length === 0 && shape.value.assetId) {
        shape.value.variants.push({
            name: null,
            assetId: shape.value.assetId,
            width: shape.value.w,
            height: shape.value.h,
        });
    }

    shape.value.variants.push({ name: null, assetId, width: shape.value.w, height: shape.value.h });
}

function removeVariant(variant: { name: string | null; assetId: AssetId; width: number; height: number }): void {
    if (!shape.value) return;
    shape.value.variants = shape.value.variants.filter((v) => v.assetId !== variant.assetId);
}

function loadVariant(variant: {
    name: string | null;
    assetId: AssetId;
    width: number;
    height: number;
    src: string;
}): void {
    if (!shape.value) return;
    shape.value.setImage(variant.src, true);
    if (variant.name) {
        propertiesSystem.setName(shape.value.id, variant.name, SERVER_SYNC);
    }
}

function updateVariantName(
    variant: { name: string | null; assetId: AssetId; width: number; height: number },
    name: string,
): void {
    if (!shape.value) return;
    const v = shape.value.variants.find((v) => v.assetId === variant.assetId);
    if (v) {
        v.name = name || null;
    }
}
</script>

<template>
    <div id="variant-settings">
        <div v-if="shape?.variants.length === 0" style="white-space: pre-wrap">
            {{ t("game.ui.selection.edit_dialog.variants.empty") }}
        </div>
        <div v-else>
            <div
                v-for="variant in augmentedVariants"
                :key="`${variant.assetId}-${variant.name}-${variant.width}-${variant.height}`"
                class="variant-row"
            >
                <img :src="variant.src" alt="" loading="lazy" class="variant-image" />
                <input
                    type="text"
                    class="variant-name"
                    :value="variant.name ?? ''"
                    placeholder="empty - no custom name"
                    @input="updateVariantName(variant, ($event.target as HTMLInputElement).value)"
                />
                <div class="variant-actions">
                    <button @click.stop="loadVariant(variant)" title="Load variant">
                        <font-awesome-icon icon="upload" />
                    </button>
                    <button @click.stop="removeVariant(variant)" title="Remove variant">
                        <font-awesome-icon icon="trash-alt" />
                    </button>
                </div>
            </div>
        </div>
        <div style="flex: 1"></div>
        <div id="root-buttons">
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
        justify-content: flex-end;
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

        button {
            background-color: rgba(255, 168, 191, 0.5);
            border: none;
            padding: 0.5rem;
            cursor: pointer;
            border-radius: 0.25rem;

            &:hover {
                background-color: #ffa8bf;
            }
        }
    }
}
</style>

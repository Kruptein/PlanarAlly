<script setup lang="ts">
import { nextTick, watch } from "vue";

import { assetGameState } from "../../systems/assets/state";
import { closeAssetManager } from "../../systems/assets/ui";
import { modalSystem } from "../../systems/modals";
import type { ModalIndex } from "../../systems/modals/types";

import AssetList from "./AssetList.vue";

const emit = defineEmits<(e: "close" | "focus") => void>();
defineExpose({ close });
const props = defineProps<{ modalIndex: ModalIndex }>();

watch(
    () => assetGameState.reactive.managerOpen,
    async (open) => {
        if (open) {
            await nextTick(() => modalSystem.focus(props.modalIndex));
        }
    },
);

function close(): void {
    closeAssetManager();
    emit("close");
}
</script>

<template>
    <div v-show="assetGameState.reactive.managerOpen" id="asset-container">
        <div id="assets-dialog" @click="$emit('focus')">
            <font-awesome-icon id="close-assets" :icon="['far', 'window-close']" @click="close" />
            <AssetList />
        </div>
    </div>
</template>

<style lang="scss">
#asset-container {
    position: absolute;
    display: grid;
    justify-items: center;
    padding-top: 10vh;
    align-items: start;
    width: 100vw;
    height: 100vh;
}

#assets-dialog {
    position: relative;
    display: flex;
    flex-direction: column;

    padding: 1.5rem 2rem;
    border-radius: 1rem;
    max-height: 80vh;
    width: 60vw;

    background-color: white;

    pointer-events: all;

    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);

    font-family: "HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande",
        sans-serif;

    overflow: hidden;

    #close-assets {
        position: absolute;

        top: 0.75rem;
        right: 0.75rem;

        font-size: 1.25rem;
    }
}
</style>

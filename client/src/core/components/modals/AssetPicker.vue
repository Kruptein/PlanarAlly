<script setup lang="ts">
import { onMounted, useTemplateRef } from "vue";

import { assetSystem } from "../../../assets";
import { socket } from "../../../assets/socket";
import { assetState } from "../../../assets/state";
import AssetListCore from "../../../assets/ui/AssetListCore.vue";
import AssetSearchCore from "../../../assets/ui/AssetSearchCore.vue";

defineProps<{ visible: boolean }>();
const emit = defineEmits(["close", "submit"]);

const searchCore = useTemplateRef<InstanceType<typeof AssetSearchCore>>("searchCore");

async function load(): Promise<void> {
    await assetSystem.loadFolder(assetState.currentFolder.value);
}

onMounted(async () => {
    if (socket.connected) {
        await load();
    } else {
        socket.connect();
        socket.once("connect", load);
    }
});

function setLogo(): void {
    const assetId = assetState.reactive.selected.at(0);
    if (assetId === undefined) return;
    const asset = assetState.raw.idMap.get(assetId);
    if (asset === undefined) return;
    emit("submit", { id: asset.id, fileHash: asset.fileHash ?? undefined });
}
</script>

<template>
    <div v-show="visible" id="asset-container">
        <div id="assets-dialog">
            <font-awesome-icon id="close-assets" :icon="['far', 'window-close']" @click="emit('close')" />

            <AssetSearchCore ref="searchCore" />

            <AssetListCore
                font-size="8em"
                :search-results="searchCore?.search.results.value ?? []"
                only-files
                disable-multi
            />

            <div id="assets-footer">
                <button :disabled="assetState.reactive.selected.length === 0" @click="setLogo">Submit</button>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
#asset-container {
    position: fixed;
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

    color: black;
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

#assets-footer {
    display: flex;
    justify-content: flex-end;

    button {
        background-color: rgba(137, 0, 37, 1);
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.25rem;
        cursor: pointer;
        font-size: 1rem;

        &:disabled {
            background-color: rgb(150, 150, 150);
            cursor: not-allowed;
        }
    }
}
</style>

<script setup lang="ts">
import { onMounted, watch } from "vue";
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router";

import { assetSystem } from "../assets";
import { socket } from "../assets/socket";
import { assetState } from "../assets/state";
import AssetListCore from "../assets/ui/AssetListCore.vue";
import AssetListCoreActions from "../assets/ui/AssetListCoreActions.vue";
import AssetUploadProgress from "../assets/ui/AssetUploadProgress.vue";
import { ctrlOrCmdPressed } from "../core/utils";

const route = useRoute();
const router = useRouter();

watch(assetState.currentFilePath, async (newPath) => {
    await router.push(`/assets${newPath}`);
});

function getCurrentPath(path?: string): string {
    path ??= route.path;
    const i = path.indexOf("/assets");
    return path.slice(i + "/assets".length);
}

async function loadFolder(path: string): Promise<void> {
    if (socket.connected) {
        await assetSystem.loadFolder(path);
    } else {
        socket.connect();
        socket.once("connect", () => assetSystem.loadFolder(path));
    }
}

onMounted(async () => {
    await loadFolder(getCurrentPath());
});

onBeforeRouteLeave(() => {
    if (socket.connected) socket.disconnect();
});

function emptySelection(event: MouseEvent): void {
    // When shift or ctrl is pressed you are probably doing a selection operation,
    // but just misclicked. We don't want this to clear the selection on accident.
    if (event.shiftKey || ctrlOrCmdPressed(event)) return;
    assetSystem.clearSelected();
}
</script>

<template>
    <div id="content" @click="emptySelection">
        <div class="content-title">
            <span>MANAGE ASSETS</span>
            <AssetListCoreActions />
        </div>

        <AssetListCore font-size="12em" />

        <AssetUploadProgress />
    </div>
</template>

<style scoped lang="scss">
#content {
    background-color: rgba(77, 59, 64, 0.6);
    border-radius: 20px;
    padding: 3.75rem;
    width: 100%;
    display: flex;
    flex-direction: column;

    .content-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 3.125em;
        color: white;
        border-bottom: 5px solid #ffa8bf;
        font-weight: bold;
        margin-bottom: 1rem;

        > div {
            display: flex;

            > img {
                &:hover {
                    cursor: pointer;
                }
            }
        }

        > span:last-child {
            color: #ffa8bf;

            &:hover {
                cursor: pointer;
            }
        }
    }

    #infobar {
        background: rgba(219, 0, 59, 1);
        border-radius: 1rem;
        padding: 1rem;
    }
}

:deep(.ContextMenu) ul {
    background: rgba(77, 0, 21);

    box-shadow: 0 0 1rem rgba(77, 0, 21, 0.5);

    li:hover {
        background: rgba(219, 0, 59, 1);
    }
}
</style>

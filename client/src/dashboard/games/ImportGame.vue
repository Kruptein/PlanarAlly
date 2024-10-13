<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useToast } from "vue-toastification";

import { http } from "../../core/http";
import { socket } from "../socket";
import { dashboardState } from "../state";

import type { RoomInfo } from "./types";
import { open } from "./utils";

const toast = useToast();

type Done = (RoomInfo & { success: true }) | { success: false; reason: string };

const name = ref("");
const takeOverName = ref(true);

const messages = ref<string[]>([]);
const done = ref<Done>({ success: false, reason: "" });

socket.on("Campaign.Import.Status", (status: string) => messages.value.unshift(status));
socket.on("Campaign.Import.Done", (data: Done) => (done.value = data));

const chunkProgress = computed(() => {
    if (dashboardState.chunkLength === 0) return 0;
    return (100 * dashboardState.chunksProcessed.size) / dashboardState.chunkLength;
});

onMounted(() => {
    dashboardState.chunkLength = 0;
    dashboardState.chunksProcessed.clear();
});

function prepareUpload(): void {
    document.getElementById("files")!.click();
}

async function uploadSave(): Promise<void> {
    dashboardState.chunkLength = 0;
    dashboardState.chunksProcessed.clear();

    const files = (document.getElementById("files") as HTMLInputElement).files;
    if (files === null || files.length === 0) return;

    const data = await http.get("/api/server/upload_limit");
    const chunkSize = (await data.json()) as number;

    const pac = files[0]!;
    const totalChunks = Math.ceil(pac.size / chunkSize);
    const response = await http.postJson(`/api/rooms/import/${pac.name}`, {
        totalChunks,
        sid: socket.id,
        takeOverName: takeOverName.value,
        name: name.value,
    });
    if (!response.ok) {
        toast.error(response.statusText, {
            timeout: false,
        });
        return;
    }
    dashboardState.chunkLength = totalChunks;

    const chunks: Promise<Response>[] = [];
    for (let i = 0; i < totalChunks; i++) {
        const chunk = pac.slice(i * chunkSize, (i + 1) * chunkSize);
        chunks.push(http.post(`/api/rooms/import/${pac.name}/${i}`, chunk));
    }
    const responses = await Promise.all(chunks);
    if (responses.some((r) => !r.ok)) {
        toast.error("Something went wrong while uploading the campaign to the server :(", {
            timeout: false,
        });
    }
}
</script>

<template>
    <div id="content">
        <div class="title">Import a campaign</div>
        <div>This is an experimental feature! If you discover any problems let me know :)</div>
        <div class="entry">
            <label for="takeOverName">Use original name:</label>
            <input id="takeOverName" v-model="takeOverName" type="checkbox" />
        </div>
        <div class="entry">
            <label for="name">Name:</label>
            <input id="name" v-model="name" type="text" :disabled="takeOverName" />
        </div>
        <template v-if="dashboardState.chunkLength === 0">
            <button @click="prepareUpload">Upload</button>
            <input id="files" type="file" hidden accept=".pac" @change="uploadSave" />
        </template>
        <template v-else>
            <div>
                <label for="chunks" style="margin-right: 20px">Upload progress:</label>
                <progress id="chunks" max="100" :value="chunkProgress">{{ chunkProgress }}%</progress>
            </div>
            <template v-if="chunkProgress === 100">
                <div>Campaign successfully uploaded. Processing data.</div>
                <div style="margin-top: 10px">
                    The server is now processing the file. Below you can see the progress of the import process. The
                    import will continue regardless of whether you have this page open.
                </div>
            </template>
            <pre style="max-height: 30vh; overflow: auto">
                <div v-if="!done.success">...</div>
                <div v-for="message of messages" :key="message">{{ message }}</div>
            </pre>
        </template>
        <!-- <div class="entry subtitle">2. Transfer directly from another server</div> -->
        <div class="action">
            <button class="go" @click="$router.push({ name: 'create-game' })">
                <font-awesome-icon icon="chevron-left" />
                <span>BACK</span>
            </button>
            <button v-if="done.success" class="go" @click="open(done as RoomInfo)">
                <font-awesome-icon icon="play" />
                <span>OPEN</span>
            </button>
        </div>
    </div>
</template>

<style scoped lang="scss">
#content {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;

    background-color: rgba(77, 59, 64, 0.6);
    border-radius: 20px;
    padding: 3.75rem;
    padding-right: 2rem; // adjust for scroll bar

    .title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 3.125em;
        color: white;
        border-bottom: 5px solid #ffa8bf;
        font-weight: bold;
        margin-bottom: 2rem;

        > span:last-child {
            color: #ffa8bf;

            &:hover {
                cursor: pointer;
            }
        }
    }

    .subtitle {
        font-size: 2.5em;
        margin-top: 1rem;
    }

    .entry {
        display: flex;
        padding: 1rem;
        justify-content: flex-start;
        align-items: center;

        label {
            width: 20vw;
            font-size: 2em;
        }

        input {
            font-size: 1.5em;
            padding: 0 1rem;
        }

        input[type="checkbox"] {
            height: 2rem;
            width: 2rem;
        }

        input[type="text"] {
            height: 3rem;
            width: 20vw;
        }

        .logo {
            width: 4vw;
            height: 4vw;
            position: relative;

            img {
                width: 4vw;
                height: 4vw;
                position: absolute;
                border-radius: 3vw;
            }

            &::before {
                content: "";
                background-color: white;
                position: absolute;
                width: 4vw;
                height: 4vw;
                border-radius: 3vw;
            }

            > .edit {
                display: none;
            }

            &:hover > .edit {
                position: absolute;

                background-color: rgba(43, 43, 43, 0.6);
                height: 4vw;
                width: 4vw;
                border-radius: 3vw;

                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 1.5vw;

                cursor: pointer;
            }
        }
    }

    .action {
        display: flex;
    }

    button {
        margin-top: 1.25rem;
        width: 15rem;
        height: 2.5rem;
        color: white;
        font-size: 1.125em;
        background-color: rgba(137, 0, 37, 1);
        border: 3px solid rgba(219, 0, 59, 1);
        border-radius: 5px;
        box-shadow: 0 0 10px 0 rgba(6, 6, 6, 0.5);

        display: flex;
        align-items: center;
        justify-content: center;

        > span {
            margin-left: 15px;
            margin-right: 15px;
        }

        &:hover {
            cursor: pointer;
        }
    }
}
</style>

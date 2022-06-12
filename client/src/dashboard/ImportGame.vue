<script setup lang="ts">
import { http } from "../core/http";

function prepareUpload(): void {
    document.getElementById("files")!.click();
}

async function uploadSave(): Promise<void> {
    const files = (document.getElementById("files") as HTMLInputElement).files;
    if (files === null || files.length === 0) return;

    const data = await http.get("/api/server/upload_limit");
    const chunkSize: number = await data.json();

    const pac = files[0];
    const totalChunks = Math.ceil(pac.size / chunkSize);
    await http.postJson(`/api/rooms/import/${pac.name}`, { totalChunks });

    const chunks: Promise<Response>[] = [];
    for (let i = 0; i < totalChunks; i++) {
        const chunk = pac.slice(i * chunkSize, (i + 1) * chunkSize);
        chunks.push(http.post(`/api/rooms/import/${pac.name}/${i}`, chunk));
    }
    await Promise.all(chunks);
}
</script>

<template>
    <div id="content">
        <div class="spanrow header">IMPORT CAMPAIGN</div>
        <div>This is an experimental feature!</div>
        <div>If you discover any problems let me know :)</div>
        <button @click="prepareUpload">Upload</button>
        <input id="files" type="file" hidden @change="uploadSave" accept=".pac" />
    </div>
</template>

<style scoped lang="scss">
#content {
    background-color: #7c253e;
    color: white;

    margin: auto;
    padding: 50px;

    display: flex;
    flex-direction: column;

    input[type="number"],
    input[type="text"],
    input[type="email"],
    input[type="password"] {
        width: 100%;
        padding: 5px;
    }

    button {
        margin-top: 15px;
        padding: 6px 12px;
        border: 1px solid lightgray;
        border-radius: 0.25em;
        background-color: rgb(235, 235, 228);
    }

    .header {
        font-size: 20px;

        line-height: 0.1em;
        margin: 30px 0;
    }

    .spanrow {
        grid-column: 1 / -1;
    }

    .row {
        display: contents;

        &:first-of-type > * {
            margin-top: 0.5em;
        }
        &:last-of-type > * {
            margin-bottom: 0.5em;
        }
        &:hover > * {
            cursor: pointer;
            text-shadow: 0px 0px 1px black;
        }

        > * {
            display: flex;
            align-items: center;
            padding: 0.5em;
        }
    }

    .danger {
        color: #7c253e;
        &:hover {
            text-shadow: 0px 0px 1px #7c253e;
            cursor: pointer;
        }
    }
}
</style>

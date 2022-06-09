<script setup lang="ts">
import { http } from "../core/http";

function prepareUpload(): void {
    document.getElementById("files")!.click();
}

async function uploadSave(): Promise<void> {
    const files = (document.getElementById("files") as HTMLInputElement).files;
    if (files === null || files.length === 0) return;

    await http.post(`/api/rooms/import/${files[0].name}`, files[0]);
}
</script>

<template>
    <div id="content">
        <div class="spanrow header">IMPORT CAMPAIGN</div>
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

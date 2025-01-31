<script setup lang="ts">
import { ref } from "vue";

import { baseAdjust } from "../../core/http";
import { socket } from "../socket";

const messages = ref<string[]>([]);
const downloadUrl = ref<string | null>(null);

socket.on("Campaign.Export.Status", (status: string) => messages.value.unshift(status));

socket.on("Campaign.Export.Done", (filename: string) => {
    downloadUrl.value = baseAdjust(`/static/temp/${filename}.pac`);
});
</script>

<template>
    <div id="content">
        <div class="title">Exporting campaign</div>
        <div>This is an experimental feature! If you discover any problems let me know :)</div>
        <div v-if="downloadUrl" class="complete">
            The export is complete! If you did not get a download prompt, you can find your file here:
            <a :href="downloadUrl">{{ downloadUrl }}</a>
        </div>
        <div class="entry subtitle">Export Status</div>
        <div>
            Here you can see the progress of your export. Currently it's recommended to leave this page open until the
            export is complete.
        </div>
        <pre style="max-height: 30vh; overflow: auto">>
            <div v-for="message of messages" :key="message">{{ message }}</div>
        </pre>
        <button class="go" @click="$router.push({ name: 'create-game' })">
            <font-awesome-icon icon="chevron-left" />
            <span>BACK</span>
        </button>
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

    .complete {
        margin-top: 2rem;
        font-size: 1.5em;
    }

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
        align-items: center;

        label {
            width: 10vw;
            font-size: 2em;
        }

        input {
            width: 20vw;
            height: 3rem;
            font-size: 1.5em;
            padding: 0 1rem;
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

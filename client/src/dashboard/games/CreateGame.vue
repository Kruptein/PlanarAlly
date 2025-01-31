<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";

import { getImageSrcFromHash } from "../../assets/utils";
import { baseAdjust, http } from "../../core/http";
import { useModal } from "../../core/plugins/modals/plugin";
import { coreStore } from "../../store/core";

import { open } from "./utils";

const modals = useModal();
const router = useRouter();
const toast = useToast();

const name = ref("");
const logo = reactive({ path: "", id: -1 });

async function create(): Promise<void> {
    if (name.value === "") {
        toast.error("Fill in a name!");
        return;
    }
    const response = await http.postJson("/api/rooms", {
        name: name.value,
        logo: logo.id,
    });
    if (response.ok) {
        await open({ creator: coreStore.state.username, name: name.value, is_locked: false, last_played: null });
        await router.push(`/game/${encodeURIComponent(coreStore.state.username)}/${encodeURIComponent(name.value)}`);
    } else if (response.statusText === "Conflict") {
        toast.error("A campaign with that name already exists!");
    } else {
        toast.error(`An unknown error occured :( ${response.statusText})`);
    }
}

async function setLogo(): Promise<void> {
    const data = await modals.assetPicker();
    if (data === undefined || data.fileHash === null) return;
    logo.path = data.fileHash;
    logo.id = data.id;
}
</script>

<template>
    <div id="content">
        <div class="title">Create a new campaign from scratch</div>
        <div class="entry">
            <label for="name">Name:</label>
            <input id="name" v-model="name" type="text" autofocus />
        </div>
        <div class="entry">
            <label for="logo">Logo:</label>
            <div class="logo">
                <img
                    alt="Campaign Logo Preview"
                    :src="
                        baseAdjust(
                            logo.id >= 0
                                ? getImageSrcFromHash(logo.path, { addBaseUrl: false })
                                : '/static/img/d20.svg',
                        )
                    "
                />
                <div class="edit" @click="setLogo"><font-awesome-icon icon="pencil-alt" /></div>
            </div>
        </div>
        <div class="entry">
            <button class="go" @click="$router.push({ name: 'create-game' })">
                <font-awesome-icon icon="chevron-left" />
                <span>BACK</span>
            </button>
            <button class="go" @click="create">
                <span>CREATE</span>
                <font-awesome-icon icon="play" />
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

<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";

import { baseAdjust, http } from "../core/http";
import { useModal } from "../core/plugins/modals/plugin";
import { coreStore } from "../store/core";

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
        await router.push(`/game/${encodeURIComponent(coreStore.state.username)}/${encodeURIComponent(name.value)}`);
    } else if (response.statusText === "Conflict") {
        toast.error("A campaign with that name already exists!");
    } else {
        toast.error(`An unknown error occured :( ${response.statusText})`);
    }
}

async function setLogo(): Promise<void> {
    const data = await modals.assetPicker();
    if (data === undefined || data.file_hash === undefined) return;
    logo.path = data.file_hash;
    logo.id = data.id;
}
</script>

<template>
    <div id="content">
        <div class="title">Create a new campaign</div>
        <div class="input">
            <div class="logo">
                <img :src="baseAdjust(logo.id >= 0 ? `/static/assets/${logo.path}` : '/static/img/d20.svg')" />
                <div class="edit" @click="setLogo"><font-awesome-icon icon="pencil-alt" /></div>
            </div>
            <div class="name">
                <label for="name">Name</label>
                <input type="text" id="name" v-model="name" />
            </div>
        </div>
        <button class="go" @click="create">
            GO
            <font-awesome-icon icon="play" />
        </button>
    </div>
</template>

<style scoped lang="scss">
#content {
    background-color: #7c253e;
    color: white;

    margin: auto;
    padding: 50px;

    font-size: 20px;

    display: flex;
    flex-direction: column;

    .title {
        font-size: 50px;
        font-weight: bold;
        margin-bottom: 15px;
    }

    .input {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .name {
            display: flex;
            flex-direction: column;

            font-size: 35px;

            input {
                width: 300px;
                font-size: 35px;
            }
        }
    }

    .logo {
        width: 8vw;
        height: 8vw;
        position: relative;

        img {
            width: 8vw;
            height: 8vw;
            position: absolute;
            border-radius: 6vw;
        }

        &::before {
            content: "";
            background-color: white;
            position: absolute;
            width: 8vw;
            height: 8vw;
            border-radius: 6vw;
        }

        > .edit {
            display: none;
        }

        &:hover > .edit {
            position: absolute;

            background-color: rgba(43, 43, 43, 0.6);
            height: 8vw;
            width: 8vw;
            border-radius: 6vw;

            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 3vw;

            cursor: pointer;
        }
    }

    .go {
        margin-top: 25px;
        font-size: 25px;
        padding: 10px;

        align-self: center;
    }
}
</style>

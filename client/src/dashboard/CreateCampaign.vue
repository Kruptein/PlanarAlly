<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { ToastObject } from "vue-toasted";

import AssetPicker from "@/core/components/modals/AssetPicker.vue";

import { coreStore } from "../core/store";
import { baseAdjust, postFetch } from "../core/utils";

@Component({ components: { AssetPicker } })
export default class CreateCampaign extends Vue {
    $refs!: {
        assetPicker: AssetPicker;
    };

    name = "";
    logo: { path: string; id: number } = { path: "", id: -1 };

    baseAdjust(src: string): string {
        return baseAdjust(src);
    }

    async setLogo(): Promise<void> {
        const data = await this.$refs.assetPicker.open();
        if (data === undefined) return;
        this.logo = {
            path: data.file_hash!,
            id: data.id,
        };
    }

    async create(): Promise<void> {
        if (this.name === "") {
            this.errorToast("Fill in a name!");
            return;
        }
        const response = await postFetch("/api/rooms", {
            name: this.name,
            logo: this.logo.id,
        });
        if (response.ok) {
            this.$router.push(`/game/${encodeURIComponent(coreStore.username)}/${encodeURIComponent(this.name)}`);
        } else if (response.statusText === "Conflict") {
            this.errorToast("A campaign with that name already exists!");
        } else {
            this.errorToast("An unknown error occured :(");
        }
    }

    private errorToast(text: string): void {
        this.$toasted.error(text, {
            position: "bottom-right",
            icon: "exclamation",
            action: [
                {
                    text: "close",
                    class: "black",
                    onClick: (e: HTMLElement, t: ToastObject) => {
                        t.goAway(0);
                    },
                },
            ],
        });
    }
}
</script>

<template>
    <div id="content">
        <AssetPicker ref="assetPicker" />
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

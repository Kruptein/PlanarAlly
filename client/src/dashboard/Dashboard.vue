<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { NavigationGuard, Route } from "vue-router";

import LanguageDropdown from "@/core/components/languageDropdown.vue";

import { baseAdjust, baseAdjustedFetch, getErrorReason } from "../core/utils";

import SessionList from "./SessionList.vue";

@Component({ components: { LanguageDropdown, SessionList } })
export default class Dashboard extends Vue {
    showLanguageDropdown = false;
    owned = [];
    joined = [];
    error = "";

    activeNavigation = 1;
    navigation: { text: string; type: "header" | "separator" | "action"; fn?: (navigation: number) => void }[] = [
        { text: "game", type: "header" },
        { text: "play", type: "action", fn: this.setActiveNavigation },
        { text: "run", type: "action", fn: this.setActiveNavigation },
        { text: "create", type: "action", fn: this.setActiveNavigation },
        { text: "", type: "separator" },
        { text: "assets", type: "header" },
        { text: "manage", type: "action", fn: this.openAssetManager },
        { text: "create", type: "action", fn: this.setActiveNavigation },
        { text: "", type: "separator" },
        { text: "Settings", type: "action", fn: this.openSettings },
        { text: "", type: "separator" },
        { text: "Logout", type: "action", fn: this.logout },
    ];

    setActiveNavigation(navigation: number): void {
        this.activeNavigation = navigation;
    }

    async beforeRouteEnter(to: Route, from: Route, next: Parameters<NavigationGuard>[2]): Promise<void> {
        const response = await baseAdjustedFetch("/api/rooms");
        next(async (vm: Vue) => {
            if (response.ok) {
                const data = await response.json();
                console.log(data);
                (vm as this).owned = data.owned;
                (vm as this).joined = data.joined;
            } else {
                (vm as this).error = await getErrorReason(response);
            }
        });
    }

    async mounted(): Promise<void> {
        // if (this.$route.params?.error === "join_game") {
        //     await this.$refs.confirm.open(
        //         "Failed to join session",
        //         "It was not possible to join the game session. This might be because the DM has locked the session.",
        //         { showNo: false, yes: "Ok" },
        //     );
        // }
    }

    baseAdjust(src: string): string {
        return baseAdjust(src);
    }

    async openAssetManager(): Promise<void> {
        await this.$router.push("/assets");
    }

    async openSettings(): Promise<void> {
        await this.$router.push("/settings");
    }

    async logout(): Promise<void> {
        await this.$router.push("/auth/logout");
    }
}
</script>

<template>
    <div id="page">
        <SessionList v-if="activeNavigation === 1" :sessions="joined" />
        <SessionList v-else-if="activeNavigation === 2" :sessions="owned" />
        <div v-else style="display: flex; justify-content: center; align-items: center; text-align: center">
            Not yet implemented
            <br />
            sorry :c
        </div>

        <div id="nav-panel">
            <div id="language-selector">
                <font-awesome-icon icon="language" @click="showLanguageDropdown = !showLanguageDropdown" />
            </div>
            <LanguageDropdown id="language-dropdown" v-if="showLanguageDropdown" />
            <div id="logo">
                <img :src="baseAdjust('/static/favicon.png')" alt="PA logo" />
            </div>
            <nav>
                <div
                    v-for="[i, nav] of navigation.entries()"
                    :class="{
                        header: nav.type === 'header',
                        separator: nav.type === 'separator',
                        selected: activeNavigation === i,
                    }"
                    @click="nav.fn(i)"
                    :key="i"
                >
                    {{ nav.type === "header" ? nav.text.toLocaleUpperCase() : nav.text }}
                </div>
            </nav>
        </div>
    </div>
</template>

<style scoped lang="scss">
* {
    box-sizing: border-box;
}

#page {
    display: grid;
    grid-template-areas: "nav content";
    --primary: #7c253e;
    --secondary: #9c455e;
    --primaryBG: rgb(43, 43, 43);
    --secondaryBG: #c4c4c4;
    background-color: var(--secondaryBG);
    grid-template-columns: 20vw minmax(0, 1fr);
    width: 100%;
}

#nav-panel {
    grid-area: nav;
    background-color: rgb(43, 43, 43);

    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 5em;

    box-shadow: -10px 0 50px rgb(43, 43, 43);
}

#logo {
    height: 12vw;
    position: relative;

    img {
        height: 10vw;
        position: relative;
    }

    &::before {
        content: "";
        background-color: white;
        position: absolute;
        left: calc(50% - 6.1vw);
        top: calc(50% - 7vw);
        width: 12vw;
        height: 12vw;
        border-radius: 6vw;
    }
}

#language-selector {
    position: absolute;
    top: 0;
    left: calc(19vw - 45px);
    font-size: 40px;
    color: white;
}

#language-dropdown {
    position: absolute;
    top: 50px;
    left: calc(19vw - 58px);
    margin-right: -20px;
}

nav {
    display: flex;
    flex-direction: column;
    justify-content: space-around;

    // align-self: flex-end;
    margin-top: 2em;
    align-items: center;

    color: white;
    font-weight: bold;
    font-size: 25px;

    div {
        text-align: center;
        width: 20vw;
        // padding-left: 2em;
        // padding-right: 3em;
        padding-top: 5px;
        padding-bottom: 5px;

        &:hover:not(.header):not(.separator) {
            cursor: pointer;
            color: black;
            background-color: white;
        }
    }

    .header {
        // padding-left: 0;
        font-style: italic;
    }

    .separator {
        margin-bottom: 25px;
    }

    .selected {
        color: black;
        background-color: white;
    }
}

.black {
    color: rgb(43, 43, 43);
}
</style>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import LanguageDropdown from "../core/components/LanguageDropdown.vue";
import { useModal } from "../core/plugins/modals/plugin";
import { baseAdjust, baseAdjustedFetch, getErrorReason } from "../core/utils";

import AccountSettings from "./AccountSettings.vue";
import CreateCampaign from "./CreateCampaign.vue";
import SessionList from "./SessionList.vue";
import { Navigation } from "./types";
import type { NavigationEntry, RoomInfo } from "./types";

enum NavigationMode {
    Main,
    Settings,
}

interface DashboardState {
    showLanguageDropdown: boolean;
    owned: RoomInfo[];
    joined: RoomInfo[];
    error: string;
    activeNavigation: Navigation;
}

const state: DashboardState = reactive({
    showLanguageDropdown: false,
    owned: [],
    joined: [],
    error: "",
    activeNavigation: Navigation.Play,
});

const modals = useModal();
const route = useRoute();
const router = useRouter();

onMounted(async () => {
    if (route.params?.error === "join_game") {
        await modals.confirm(
            "Failed to join session",
            "It was not possible to join the game session. This might be because the DM has locked the session.",
            { showNo: false, yes: "Ok" },
        );
    }

    const response = await baseAdjustedFetch("/api/rooms");
    if (response.ok) {
        const data: { owned: RoomInfo[]; joined: RoomInfo[] } = await response.json();
        console.log(data);
        state.owned = data.owned;
        state.joined = data.joined;
    } else {
        state.error = await getErrorReason(response);
    }
});

const mainNavigation: NavigationEntry[] = [
    { text: "game", type: "header" },
    { type: "action", navigation: Navigation.Play, fn: setActiveNavigation },
    { type: "action", navigation: Navigation.Run, fn: setActiveNavigation },
    { type: "action", navigation: Navigation.Create, fn: setActiveNavigation },
    { type: "separator" },
    { text: "assets", type: "header" },
    { type: "action", navigation: Navigation.AssetManage, fn: openAssetManager },
    { type: "action", navigation: Navigation.AssetCreate, fn: setActiveNavigation },
    { type: "separator" },
    { type: "action", navigation: Navigation.Settings, fn: toggleNavigation },
    { type: "separator" },
    { type: "action", navigation: Navigation.Logout, fn: logout },
];

const settingsNavigation: NavigationEntry[] = [
    { text: "settings", type: "header" },
    { type: "action", navigation: Navigation.Account, fn: setActiveNavigation },
    { type: "separator" },
    { type: "action", navigation: Navigation.Back, fn: toggleNavigation },
];

const activeNavigation = ref(NavigationMode.Main);
const navigation = computed(() =>
    activeNavigation.value === NavigationMode.Main ? mainNavigation : settingsNavigation,
);

const navigationTranslation: Record<Navigation, string> = {
    [Navigation.Play]: "play",
    [Navigation.Run]: "run",
    [Navigation.Create]: "create",
    [Navigation.Settings]: "settings",
    [Navigation.AssetManage]: "manage",
    [Navigation.AssetCreate]: "create",
    [Navigation.Logout]: "logout",

    [Navigation.Account]: "account",
    [Navigation.Back]: "back",
};

function setActiveNavigation(navigationIndex: Navigation): void {
    if (navigationIndex === Navigation.Run && state.owned.length === 0) navigationIndex = Navigation.Create;
    state.activeNavigation = navigationIndex;
}

function toggleNavigation(): void {
    if (activeNavigation.value === NavigationMode.Main) {
        activeNavigation.value = NavigationMode.Settings;
    } else {
        activeNavigation.value = NavigationMode.Main;
    }
}

async function openAssetManager(): Promise<void> {
    await router.push("/assets");
}

async function logout(): Promise<void> {
    await router.push("/auth/logout");
}

function leaveRoom(index: number): void {
    state.joined.splice(index, 1);
}

function rename(index: number, name: string): void {
    state.owned[index].name = name;
}

function removeRoom(index: number): void {
    state.owned.splice(index, 1);
}

function updateLogo(index: number, logo: string): void {
    state.owned[index].logo = logo;
}
</script>

<template>
    <div id="page">
        <SessionList
            v-if="state.activeNavigation === Navigation.Play"
            :sessions="state.joined"
            :dmMode="false"
            @remove-room="leaveRoom"
        />
        <SessionList
            v-else-if="state.activeNavigation === Navigation.Run"
            :sessions="state.owned"
            :dmMode="true"
            @rename="rename"
            @remove-room="removeRoom"
            @update-logo="updateLogo"
        />
        <CreateCampaign v-else-if="state.activeNavigation === Navigation.Create" />
        <AccountSettings v-else-if="state.activeNavigation === Navigation.Account" />
        <div v-else id="not-implemented">
            <img :src="baseAdjust('/static/img/d20-fail.svg')" />
            <div class="padding bold">OOF, That's a critical one!</div>
            <div>This feature is still in development,</div>
            <div>come back later!</div>
        </div>

        <div id="nav-panel">
            <div id="language-selector">
                <font-awesome-icon icon="language" @click="state.showLanguageDropdown = !state.showLanguageDropdown" />
            </div>
            <LanguageDropdown id="language-dropdown" v-if="state.showLanguageDropdown" />
            <div id="logo">
                <img :src="baseAdjust('/static/favicon.png')" alt="PA logo" />
            </div>
            <nav>
                <template v-for="nav of navigation">
                    <div
                        v-if="nav.type === 'action'"
                        :key="nav.navigation"
                        @click="nav.fn(nav.navigation)"
                        :class="{
                            selected: state.activeNavigation === nav.navigation,
                        }"
                    >
                        {{ navigationTranslation[nav.navigation] }}
                    </div>
                    <div v-else-if="nav.type === 'header'" :key="nav.text" class="header">
                        {{ nav.text }}
                    </div>
                    <div v-else class="separator" :key="nav.type"></div>
                </template>
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

#not-implemented {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;

    background-color: #7c253e;
    color: white;

    margin: auto;
    padding: 50px;

    font-size: 20px;

    > div {
        padding-bottom: 10px;
    }

    .bold {
        font-weight: bold;
    }

    .padding {
        padding-bottom: 20px;
    }

    img {
        filter: invert(100%) sepia(0%) saturate(6492%) hue-rotate(348deg) brightness(107%) contrast(99%);
        width: 10vw;
    }
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
    left: 25px;
    font-size: 40px;
    color: white;
}

#language-dropdown {
    position: absolute;
    top: 50px;
    left: 20px;
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

        text-transform: capitalize;

        &:hover:not(.header):not(.separator) {
            cursor: pointer;
            color: black;
            background-color: white;
        }
    }

    .header {
        // padding-left: 0;
        font-style: italic;
        text-transform: uppercase;
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

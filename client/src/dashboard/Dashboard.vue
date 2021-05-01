<script lang="ts">
import { defineComponent, onMounted, reactive, toRefs } from "vue";
import { NavigationGuardNext, RouteLocationNormalized, useRoute, useRouter } from "vue-router";

import LanguageDropdown from "../core/components/LanguageDropdown.vue";
import { useModal } from "../core/plugins/modals/plugin";
import { baseAdjust, baseAdjustedFetch, getErrorReason } from "../core/utils";

import CreateCampaign from "./CreateCampaign.vue";
import SessionList from "./SessionList.vue";
import { RoomInfo } from "./types";

interface DashboardState {
    showLanguageDropdown: boolean;
    owned: RoomInfo[];
    joined: RoomInfo[];
    error: string;
    activeNavigation: number;
}

const state: DashboardState = reactive({
    showLanguageDropdown: false,
    owned: [],
    joined: [],
    error: "",
    activeNavigation: 1,
});

export default defineComponent({
    name: "Dashboard",
    components: { CreateCampaign, LanguageDropdown, SessionList },
    async beforeRouteEnter(_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) {
        const response = await baseAdjustedFetch("/api/rooms");
        next(async () => {
            if (response.ok) {
                const data: { owned: RoomInfo[]; joined: RoomInfo[] } = await response.json();
                state.owned = data.owned;
                state.joined = data.joined;
            } else {
                state.error = await getErrorReason(response);
            }
        });
    },
    setup() {
        const modals = useModal();
        const route = useRoute();
        const router = useRouter();

        const navigation: {
            text: string;
            type: "header" | "separator" | "action";
            fn?: (navigation: number) => void;
        }[] = [
            { text: "game", type: "header" },
            { text: "play", type: "action", fn: setActiveNavigation },
            { text: "run", type: "action", fn: setActiveNavigation },
            { text: "create", type: "action", fn: setActiveNavigation },
            { text: "", type: "separator" },
            { text: "assets", type: "header" },
            { text: "manage", type: "action", fn: openAssetManager },
            { text: "create", type: "action", fn: setActiveNavigation },
            { text: "", type: "separator" },
            { text: "Settings", type: "action", fn: openSettings },
            { text: "", type: "separator" },
            { text: "Logout", type: "action", fn: logout },
        ];

        onMounted(async () => {
            if (route.params?.error === "join_game") {
                await modals.confirm(
                    "Failed to join session",
                    "It was not possible to join the game session. This might be because the DM has locked the session.",
                    { showNo: false, yes: "Ok" },
                );
            }
        });

        function setActiveNavigation(navigationIndex: number): void {
            if (navigationIndex === 2 && state.owned.length === 0) navigationIndex = 3;
            state.activeNavigation = navigationIndex;
        }

        async function openAssetManager(): Promise<void> {
            await router.push("/assets");
        }

        async function openSettings(): Promise<void> {
            await router.push("/settings");
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

        return { ...toRefs(state), baseAdjust, leaveRoom, navigation, removeRoom, rename, updateLogo };
    },
});
</script>

<template>
    <div id="page">
        <SessionList v-if="activeNavigation === 1" :sessions="joined" :dmMode="false" @remove-room="leaveRoom" />
        <SessionList
            v-else-if="activeNavigation === 2"
            :sessions="owned"
            :dmMode="true"
            @rename="rename"
            @remove-room="removeRoom"
            @update-logo="updateLogo"
        />
        <CreateCampaign v-else-if="activeNavigation === 3" />
        <div v-else id="not-implemented">
            <img :src="baseAdjust('/static/img/d20-fail.svg')" />
            <div class="padding bold">OOF, That's a critical one!</div>
            <div>This feature is still in development,</div>
            <div>come back later!</div>
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
                    {{ nav.text }}
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

<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";

import { getStaticImg } from "../core/http";

const route = useRoute();
const router = useRouter();

interface Section {
    nav: string;
    routerPath: string;
    routerName?: string;
}
const sections: Section[] = [
    {
        nav: "GAMES",
        routerPath: "games",
    },
    {
        nav: "ASSETS",
        routerPath: "assets",
    },
    {
        nav: "SETTINGS",
        routerPath: "settings",
        routerName: "dashboard-settings",
    },
];

function isActiveSection(section: Section): boolean {
    const path = route.path;
    return path.startsWith(`/dashboard/${section.routerPath}`) || path.startsWith(`/${section.routerPath}`);
}

async function activate(section: Section): Promise<void> {
    await router.push({ name: section.routerName ?? section.routerPath });
}

const image = "background-borderless.png";
const backgroundImage = `url(${getStaticImg(image)})`;

async function logout(): Promise<void> {
    await router.push("/auth/logout");
}
</script>

<template>
    <div style="width: 100%">
        <div id="background" :style="{ backgroundImage }"></div>
        <main>
            <section id="sidebar">
                <img id="icon" :src="getStaticImg('pa_game_icon.png')" alt="PlanarAlly logo" />
                <nav>
                    <template v-for="section of sections" :key="section.nav">
                        <div
                            class="nav-item"
                            :class="{ 'nav-active': isActiveSection(section) }"
                            @click="activate(section)"
                        >
                            {{ section.nav }}
                        </div>
                    </template>
                    <div style="flex-grow: 1; height: 10.4rem"></div>
                    <button @click="logout">
                        <img :src="getStaticImg('cross.svg')" alt="Cross" />
                        LOG OUT
                    </button>
                </nav>
            </section>
            <router-view></router-view>
        </main>
    </div>
</template>

<style scoped lang="scss">
#background {
    position: fixed;
    height: 100vh;
    width: 100%;
    background-size: cover;
}

main {
    $margin: 2.5rem;

    position: relative;
    display: flex;

    width: calc(100vw - (100vw - 100%) - 2 * $margin); // (100vw - 100%) is to account for scrollbar

    color: white;
    background-color: rgba(0, 0, 0, 0.6);

    margin: $margin;
    padding: $margin;
    border-radius: 40px;

    #sidebar {
        width: 16.25rem;
        margin-right: calc(2 * $margin);
        display: flex;
        flex-direction: column;

        #icon {
            margin-bottom: $margin;
        }

        nav {
            background-color: rgba(77, 0, 21, 0.8);
            border-radius: 20px;
            padding: 1.875rem;
            display: flex;
            flex-direction: column;
            align-items: center;

            .nav-item {
                color: white;
                font-size: 1.5em;
                margin-bottom: 1.875rem;
                font-weight: bold;
                border-bottom: 5px solid transparent;
                padding: 0 1.5rem;
            }

            .nav-active,
            .nav-item:hover {
                border-bottom: 5px solid #ffa8bf;
                cursor: pointer;
            }

            .nav-data {
                justify-self: flex-start;
                width: 100%;
                margin-bottom: 0.3rem;
                display: flex;
                align-items: center;
                font-size: 1.125em;
                line-height: 1.75rem;

                > span:first-child {
                    color: #ffa8bf;
                    margin-right: 0.3rem;
                }
            }

            button {
                margin-top: 1.25rem;
                width: 100%;
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

                &:hover {
                    cursor: pointer;
                }
            }
        }
    }
}
</style>

<script setup lang="ts">
import { computed, toRef } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

import type { LocalId } from "../../../core/id";
import { coreStore } from "../../../store/core";
import { clearGame } from "../../clear";
import { setCenterPosition } from "../../position";
import { toggleAssetManager } from "../../systems/assets/ui";
import { clientSystem } from "../../systems/client";
import type { ClientId } from "../../systems/client/models";
import { gameState } from "../../systems/game/state";
import { markerSystem } from "../../systems/markers";
import { markerState } from "../../systems/markers/state";
import { toggleNoteManager } from "../../systems/notes/ui";
import { playerState } from "../../systems/players/state";
import { getProperties } from "../../systems/properties/state";
import { uiSystem } from "../../systems/ui";
import { uiState } from "../../systems/ui/state";

import Characters from "./Characters.vue";

const router = useRouter();
const { t } = useI18n();

const username = toRef(coreStore.state, "username");

async function exit(): Promise<void> {
    clearGame("leaving");
    await router.push({ name: "games" });
}

function settingsClick(event: MouseEvent): void {
    const target = event.target as HTMLDivElement;
    if (
        target.classList.contains("menu-accordion") &&
        (target.nextElementSibling?.classList.contains("menu-accordion-panel") ?? false)
    ) {
        target.classList.toggle("menu-accordion-active");
    }
}

function delMarker(marker: LocalId): void {
    markerSystem.removeMarker(marker, true);
}

function jumpToMarker(marker: LocalId): void {
    markerSystem.jumpToMarker(marker);
}

function nameMarker(marker: LocalId): string {
    const props = getProperties(marker);
    if (props !== undefined) {
        return props.name;
    } else {
        return "";
    }
}

const clientInfo = computed(() => {
    const info = [];
    for (const [playerId, player] of playerState.reactive.players) {
        const clients = [...clientSystem.getClients(playerId)];
        if (clients.length > 0) info.push({ player, client: clients[0]! });
    }
    return info;
});

function jumpToClient(client: ClientId): void {
    const location = clientSystem.getClientLocation(client);
    if (location === undefined) return;

    setCenterPosition(location);
}

const openDmSettings = (): void => uiSystem.showDmSettings(!uiState.raw.showDmSettings);
const openClientSettings = (): void => uiSystem.showClientSettings(!uiState.raw.showClientSettings);
</script>

<template>
    <!-- SETTINGS -->
    <div id="menu" @click="settingsClick">
        <div style="width: 12.5rem; overflow-y: auto; overflow-x: hidden">
            <!-- CHARACTERS -->
            <Characters />
            <!-- ASSETS -->
            <template v-if="gameState.isDmOrFake.value">
                <button class="menu-accordion" @click="toggleAssetManager">{{ t("common.assets") }}</button>
            </template>
            <!-- NOTES -->
            <button class="menu-accordion" @click="toggleNoteManager">
                {{ t("common.notes") }}
            </button>
            <template v-if="gameState.isDmOrFake.value">
                <!-- DM SETTINGS -->
                <button class="menu-accordion" @click="openDmSettings">
                    {{ t("game.ui.menu.MenuBar.dm_settings") }}
                </button>
                <!-- PLAYERS -->
                <button class="menu-accordion">{{ t("common.players") }}</button>
                <div class="menu-accordion-panel">
                    <div id="menu-players" class="menu-accordion-subpanel">
                        <template v-for="info of clientInfo" :key="info.client">
                            <div v-if="info.player.name !== username" style="cursor: pointer">
                                <div class="menu-accordion-subpanel-text" @click="jumpToClient(info.client)">
                                    {{ info.player.name }}
                                </div>
                            </div>
                        </template>
                        <div v-if="clientInfo.length === 0">{{ t("game.ui.menu.MenuBar.no_players") }}</div>
                    </div>
                </div>
            </template>
            <!-- MARKERS -->
            <button class="menu-accordion">{{ t("common.markers") }}</button>
            <div class="menu-accordion-panel">
                <div id="menu-markers" class="menu-accordion-subpanel">
                    <div v-for="marker of markerState.reactive.markers.values()" :key="marker" style="cursor: pointer">
                        <div class="menu-accordion-subpanel-text" @click="jumpToMarker(marker)">
                            {{ nameMarker(marker) || "[?]" }}
                        </div>
                        <div :title="t('game.ui.menu.MenuBar.delete_marker')" @click="delMarker(marker)">
                            <font-awesome-icon icon="minus-square" />
                        </div>
                    </div>
                    <div v-if="markerState.reactive.markers.size === 0">{{ t("game.ui.menu.MenuBar.no_markers") }}</div>
                </div>
            </div>
            <!-- CLIENT SETTINGS -->
            <button class="menu-accordion" @click="openClientSettings">
                {{ t("game.ui.menu.MenuBar.client_settings") }}
            </button>
        </div>
        <div
            class="menu-accordion"
            style="width: 12.5rem; box-sizing: border-box; text-decoration: none; display: inline-block"
            @click="exit"
        >
            {{ t("common.exit") }}
        </div>
    </div>
</template>

<style scoped lang="scss">
.menu-accordion-active + #menu-assets {
    display: flex;
    flex-direction: column;
}

#asset-search {
    text-align: center;

    &::placeholder {
        text-align: center;
    }
}

/*
DIRECTORY.CSS changes

* Collapse all folders by default, use js to toggle visibility on click.
* On hover over folder show some visual feedback
* On hover over file show the image

*/
.folder {
    > * {
        display: none;
    }

    &:hover {
        font-weight: bold;
        cursor: pointer;
    }

    &:hover > * {
        font-weight: normal;
    }
}

.directory > .folder,
.directory > .file {
    display: block;
}

#menu {
    display: flex;
    position: relative;
    grid-area: menu;

    max-width: 12.5rem;

    flex-direction: column;
    justify-content: space-between;

    background-color: #fa5a5a;
    overflow: auto;
    pointer-events: auto;
    touch-action: none;
}

.actionButton {
    position: absolute;
    right: 5px;
    top: 3px;
}

:deep() {
    .menu-accordion {
        background-color: #eee;
        color: #444;
        cursor: pointer;
        padding: 1rem;
        text-align: left;
        border: none;
        outline: none;
        transition: 0.4s;
        border-top: solid 1px #82c8a0;
        width: 100%;
        width: -moz-available;
        width: -webkit-fill-available;
        width: stretch;
    }

    .menu-accordion-active,
    .menu-accordion:hover {
        background-color: #82c8a0;
    }

    .menu-accordion-panel {
        background-color: white;
        display: none;
        overflow: hidden;
        min-height: 2em;
    }

    .menu-accordion-active + .menu-accordion-panel {
        display: block;
    }

    .menu-accordion-subpanel {
        display: flex;
        flex-direction: column;
        width: 100%;

        > * {
            padding: 5px;
            display: flex;
            justify-content: space-evenly;
            align-items: center;

            &:hover {
                background-color: #82c8a0;
            }
        }
    }

    .menu-accordion-subpanel-text {
        text-align: left;
        justify-content: flex-start;
        flex: 1;
    }
}
</style>

<script setup lang="ts">
import { computed, ref, toRef } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

import { baseAdjust } from "../../../core/http";
import type { AssetFile } from "../../../core/models/types";
import { uuidv4 } from "../../../core/utils";
import { getGameState } from "../../../store/_game";
import { coreStore } from "../../../store/core";
import { gameStore } from "../../../store/game";
import { uiStore } from "../../../store/ui";
import { clearGame } from "../../clear";
import type { LocalId } from "../../id";
import type { Note } from "../../models/general";
import { setCenterPosition } from "../../position";
import { clientSystem } from "../../systems/client";
import type { ClientId } from "../../systems/client/models";
import { playerState } from "../../systems/players/state";
import { getProperties } from "../../systems/properties/state";
import NoteDialog from "../NoteDialog.vue";

import AssetParentNode from "./AssetParentNode.vue";

const router = useRouter();
const { t } = useI18n();

const showNote = ref(false);

const assetSearch = ref("");
const gameState = getGameState();

const isDm = toRef(gameState, "isDm");
const notes = toRef(gameState, "notes");
const markers = toRef(gameState, "markers");

const username = toRef(coreStore.state, "username");

const noAssets = computed(() => {
    return gameState.assets.size === 1 && (gameState.assets.get("__files") as AssetFile[]).length <= 0;
});

async function exit(): Promise<void> {
    clearGame(false);
    await router.push({ name: "dashboard" });
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

function createNote(): void {
    const note = { title: t("game.ui.menu.MenuBar.new_note"), text: "", uuid: uuidv4() };
    gameStore.newNote(note, true);
    openNote(note);
}

function openNote(note: Note): void {
    showNote.value = true;
    uiStore.setActiveNote(note);
}

function delMarker(marker: LocalId): void {
    gameStore.removeMarker(marker, true);
}

function jumpToMarker(marker: LocalId): void {
    gameStore.jumpToMarker(marker);
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
        const clients = clientSystem.getClients(playerId);
        info.push({ player, client: clients[0] });
    }
    return info;
});

function jumpToClient(client: ClientId): void {
    const location = clientSystem.getClientLocation(client);
    if (location === undefined) return;

    setCenterPosition(location);
}

const openDmSettings = (): void => uiStore.showDmSettings(!uiStore.state.showDmSettings);
const openClientSettings = (): void => uiStore.showClientSettings(!uiStore.state.showClientSettings);
</script>

<template>
    <NoteDialog v-model:visible="showNote" />
    <!-- SETTINGS -->
    <div id="menu" @click="settingsClick">
        <div style="width: 12.5rem; overflow-y: auto; overflow-x: hidden">
            <!-- ASSETS -->
            <template v-if="isDm">
                <button class="menu-accordion">{{ t("common.assets") }}</button>
                <div id="menu-assets" class="menu-accordion-panel" style="position: relative">
                    <input id="asset-search" v-model="assetSearch" :placeholder="t('common.search')" />
                    <a
                        class="actionButton"
                        style="top: 25px"
                        :href="baseAdjust('/assets')"
                        target="blank"
                        :title="t('game.ui.menu.MenuBar.open_asset_manager')"
                    >
                        <font-awesome-icon icon="external-link-alt" />
                    </a>
                    <div class="directory" id="menu-tokens">
                        <AssetParentNode :search="assetSearch.toLowerCase()" />
                        <div v-if="noAssets">
                            {{ t("game.ui.menu.MenuBar.no_assets") }}
                        </div>
                    </div>
                </div>
                <!-- NOTES -->
                <button class="menu-accordion">{{ t("common.notes") }}</button>
                <div class="menu-accordion-panel">
                    <div class="menu-accordion-subpanel" id="menu-notes" style="position: relative">
                        <div v-for="note in notes" :key="note.uuid" @click="openNote(note)" style="cursor: pointer">
                            {{ note.title || "[?]" }}
                        </div>
                        <div v-if="!notes.length">{{ t("game.ui.menu.MenuBar.no_notes") }}</div>
                        <a class="actionButton" @click="createNote" :title="t('game.ui.menu.MenuBar.create_note')">
                            <font-awesome-icon icon="plus-square" />
                        </a>
                    </div>
                </div>
                <!-- DM SETTINGS -->
                <button class="menu-accordion" @click="openDmSettings">
                    {{ t("game.ui.menu.MenuBar.dm_settings") }}
                </button>
                <!-- PLAYERS -->
                <button class="menu-accordion">Players</button>
                <div class="menu-accordion-panel">
                    <div class="menu-accordion-subpanel" id="menu-players">
                        <template v-for="info of clientInfo" :key="info.client">
                            <div v-if="info.player.name !== username" style="cursor: pointer">
                                <div @click="jumpToClient(info.client)" class="menu-accordion-subpanel-text">
                                    {{ info.player.name }}
                                </div>
                            </div>
                        </template>
                        <div v-if="clientInfo.length === 0">No players connected</div>
                    </div>
                </div>
            </template>
            <!-- MARKERS -->
            <button class="menu-accordion">{{ t("common.markers") }}</button>
            <div class="menu-accordion-panel">
                <div class="menu-accordion-subpanel" id="menu-markers">
                    <div v-for="marker of markers.values()" :key="marker" style="cursor: pointer">
                        <div @click="jumpToMarker(marker)" class="menu-accordion-subpanel-text">
                            {{ nameMarker(marker) || "[?]" }}
                        </div>
                        <div @click="delMarker(marker)" :title="t('game.ui.menu.MenuBar.delete_marker')">
                            <font-awesome-icon icon="minus-square" />
                        </div>
                    </div>
                    <div v-if="markers.size === 0">{{ t("game.ui.menu.MenuBar.no_markers") }}</div>
                </div>
            </div>
            <!-- CLIENT SETTINGS -->
            <button class="menu-accordion" @click="openClientSettings">
                {{ t("game.ui.menu.MenuBar.client_settings") }}
            </button>
        </div>
        <div
            @click="exit"
            class="menu-accordion"
            style="width: 12.5rem; box-sizing: border-box; text-decoration: none; display: inline-block"
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

#menuContainer {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    pointer-events: none;
}

#menu {
    grid-area: menu;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background-color: #fa5a5a;
    overflow: auto;
    pointer-events: auto;
    max-width: 12.5rem;
}

.actionButton {
    position: absolute;
    right: 5px;
    top: 3px;
}

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
</style>

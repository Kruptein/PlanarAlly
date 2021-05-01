<script lang="ts">
import { computed, defineComponent, ref, toRef } from "vue";
import { useI18n } from "vue-i18n";

import { AssetFile } from "../../../core/models/types";
import { baseAdjust, uuidv4 } from "../../../core/utils";
import { gameStore } from "../../../store/game";
import { UuidMap } from "../../../store/shapeMap";
import { uiStore } from "../../../store/ui";
import { Note } from "../../models/general";
import NoteDialog from "../NoteDialog.vue";

import AssetNode from "./AssetNode.vue";

export default defineComponent({
    name: "MenuBar",
    components: { AssetNode, NoteDialog },
    setup() {
        const { t } = useI18n();

        const showNote = ref(false);

        const assetSearch = ref("");
        const gameState = gameStore.state;

        const noAssets = computed(() => {
            return gameState.assets.size === 1 && (gameState.assets.get("__files") as AssetFile[]).length <= 0;
        });

        function settingsClick(event: { target: HTMLElement }): void {
            if (
                event.target.classList.contains("menu-accordion") &&
                (event.target.nextElementSibling?.classList.contains("menu-accordion-panel") ?? false)
            ) {
                event.target.classList.toggle("menu-accordion-active");
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

        function delMarker(marker: string): void {
            gameStore.removeMarker(marker, true);
        }

        function jumpToMarker(marker: string): void {
            gameStore.jumpToMarker(marker);
        }

        function nameMarker(marker: string): string {
            const shape = UuidMap.get(marker);
            if (shape !== undefined) {
                return shape.name;
            } else {
                return "";
            }
        }

        return {
            baseAdjust,
            settingsClick,
            t,
            isDm: toRef(gameState, "isDm"),

            assets: toRef(gameState, "assets"),
            assetSearch,
            noAssets,

            createNote,
            activeNote: toRef(uiStore.state, "activeNote"),
            notes: toRef(gameState, "notes"),
            openNote,
            showNote,

            openDmSettings: () => uiStore.showDmSettings(!uiStore.state.showDmSettings),

            markers: toRef(gameState, "markers"),
            delMarker,
            jumpToMarker,
            nameMarker,

            openClientSettings: () => uiStore.showClientSettings(!uiStore.state.showClientSettings),
        };
    },
});
</script>

<template>
    <NoteDialog v-model:visible="showNote" />
    <!-- SETTINGS -->
    <div id="menu" @click="settingsClick">
        <div style="width: 200px; overflow-y: auto; overflow-x: hidden">
            <!-- ASSETS -->
            <template v-if="isDm">
                <button class="menu-accordion" v-t="'common.assets'"></button>
                <div id="menu-assets" class="menu-accordion-panel">
                    <input id="asset-search" v-model="assetSearch" :placeholder="t('common.search')" />
                    <a
                        class="actionButton"
                        :href="baseAdjust('/assets')"
                        target="blank"
                        :title="t('game.ui.menu.MenuBar.open_asset_manager')"
                    >
                        <font-awesome-icon icon="external-link-alt" />
                    </a>
                    <div class="directory" id="menu-tokens">
                        <AssetNode :asset="assets" :search="assetSearch.toLowerCase()" />
                        <div v-if="noAssets">
                            {{ t("game.ui.menu.MenuBar.no_assets") }}
                        </div>
                    </div>
                </div>
                <!-- NOTES -->
                <button class="menu-accordion" v-t="'common.notes'"></button>
                <div class="menu-accordion-panel">
                    <div class="menu-accordion-subpanel" id="menu-notes" style="position: relative">
                        <div v-for="note in notes" :key="note.uuid" @click="openNote(note)" style="cursor: pointer">
                            {{ note.title || "[?]" }}
                        </div>
                        <div v-if="!notes.length" v-t="'game.ui.menu.MenuBar.no_notes'"></div>
                        <a class="actionButton" @click="createNote" :title="t('game.ui.menau.MenuBar.create_note')">
                            <font-awesome-icon icon="plus-square" />
                        </a>
                    </div>
                </div>
                <!-- DM SETTINGS -->
                <button
                    class="menu-accordion"
                    @click="openDmSettings"
                    v-t="'game.ui.menu.MenuBar.dm_settings'"
                ></button>
            </template>
            <!-- MARKERS -->
            <button class="menu-accordion" v-t="'common.markers'"></button>
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
                    <div v-if="markers.size === 0" v-t="'game.ui.menu.MenuBar.no_markers'"></div>
                </div>
            </div>
            <!-- CLIENT SETTINGS -->
            <button
                class="menu-accordion"
                @click="openClientSettings"
                v-t="'game.ui.menu.MenuBar.client_settings'"
            ></button>
        </div>
        <router-link
            to="/dashboard"
            class="menu-accordion"
            style="width: 200px; box-sizing: border-box; text-decoration: none; display: inline-block"
        >
            {{ t("common.exit") }}
        </router-link>
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
    max-width: 200px;
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
    padding: 18px;
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

<script setup lang="ts">
import { computed, onMounted, ref, toRef } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

import { baseAdjust } from "../../../core/http";
import type { AssetFile } from "../../../core/models/types";
import { coreStore } from "../../../store/core";
import { clearGame } from "../../clear";
import type { LocalId } from "../../id";
import { setCenterPosition } from "../../position";
import { clientSystem } from "../../systems/client";
import type { ClientId } from "../../systems/client/models";
import { clientState } from "../../systems/client/state";
import { gameState } from "../../systems/game/state";
import { markerSystem } from "../../systems/markers";
import { markerState } from "../../systems/markers/state";
import { toggleNoteManager } from "../../systems/notes/ui";
import { playerState } from "../../systems/players/state";
import { getProperties } from "../../systems/properties/state";
import { uiSystem } from "../../systems/ui";
import { uiState } from "../../systems/ui/state";

import AssetParentNode from "./AssetParentNode.vue";
import Characters from "./Characters.vue";
import { audioSystem } from "../../systems/audio";
import { audioService } from './audioService';

const router = useRouter();
const { t } = useI18n();

const assetSearch = ref("");

const username = toRef(coreStore.state, "username");

const noAssets = computed(() => {
    const assets = gameState.reactive.assets;
    return assets.size === 1 && (assets.get("__files") as AssetFile[]).length <= 0;
});

const hasGameboardClients = computed(() => clientState.reactive.clientBoards.size > 0);

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
const openLgSettings = (): void => uiSystem.showLgSettings(!uiState.raw.showLgSettings);

// Ref to store available mp3 assets
const audioAssets = ref<AssetFile[]>([]);
// Ref to store the selected audio path
const selectedAudioHash = ref("");
const selectedPreviewAudioHash = ref("");
var isAudioLooping = ref(false);

const getAssetPath = (assetHash: string): string => {
  return `/static/assets/${assetHash}`;
};

// Fetch assets from the game state and filter them by mp3 type
const loadAudioAssets = () => {
    const assets = gameState.reactive.assets.get("__files") as AssetFile[] || [];
    audioAssets.value = assets.filter(asset => asset.name.endsWith(".mp3"));
  
  // Set the first asset as the default selected one
//   if (audioAssets.value.length > 0) {
//     selectedPreviewAudioHash.value = getAssetPath(audioAssets.value[0].hash);  // Utilise la fonction getAssetPath
//   }
};

// Function to play the selected audio
const playPreviewAudio = (hash: string) => {
  const audioElement = document.getElementById("AdminPreviewAudioPlayer") as HTMLAudioElement;
  const sourceElement = document.getElementById("AdminPreviewAudioSource") as HTMLSourceElement;
  sourceElement.src = getAssetPath(hash);
  audioElement.load();
  audioElement.play();
};

// Call the function to load audio assets when the component is mounted
onMounted(() => {
    loadAudioAssets();
    // Initialisation de audioPlayer et audioSource après que le DOM est monté
    audioService.audioPlayer = document.getElementById("clientAudioPlayer") as HTMLAudioElement;
    audioService.audioSource = document.getElementById("clientAudioSource") as HTMLSourceElement;

    if (!audioService.audioPlayer || !audioService.audioSource) {
        console.error("Audio player or audio source not found in the DOM");
    }
});
///// from DM /////
function playAudioForRoom(action: string, fileName: string): void {
    audioSystem.PlayAudioForRoom(action, fileName);
}
function stopAudioForRoom(action: string): void {
    audioSystem.StopAudioForRoom(action);
}
function toggleLoopAudioForRoom(action: string): void {
    isAudioLooping.value = !isAudioLooping.value;
    audioSystem.ToggleLoopAudioForRoom(action);
}
///// end from DM /////

///// from Player /////
// // Références au lecteur audio et à la source
// const clientAudioPlayer = document.getElementById("clientAudioPlayer") as HTMLAudioElement;
// const clientAudioSource = document.getElementById("clientAudioSource") as HTMLAudioElement;

// // Méthode pour démarrer la lecture de l'audio
// function startPlayback(file: string) {
//     clientAudioSource.src = getAssetPath(file);
//     clientAudioPlayer.load();  // Recharge la nouvelle source
//     clientAudioPlayer.play();  // Lance la lecture
// }

// // Méthode pour arrêter l'audio
// function stopPlayback() {
//     clientAudioPlayer.pause();
//     clientAudioPlayer.currentTime = 0;  // Réinitialise la lecture
// }

// // Méthode pour activer/désactiver la lecture en boucle
// function toggleLoopPlayback() {
//     clientAudioPlayer.loop = !clientAudioPlayer.loop;
// }

// // Exposer les méthodes pour les appeler depuis `index.ts`
// defineExpose({
//     startPlayback,
//     stopPlayback,
//     toggleLoopPlayback,
//   });

///// END from Player /////

</script>

<template>
    <!-- SETTINGS -->
    <div id="menu" @click="settingsClick">
        <div style="width: 12.5rem; overflow-y: auto; overflow-x: hidden">
            <!-- CHARACTERS -->
            <Characters />
            <!-- ASSETS -->
            <template v-if="gameState.isDmOrFake.value">
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
                    <div id="menu-tokens" class="directory">
                        <AssetParentNode :search="assetSearch.toLowerCase()" />
                        <div v-if="noAssets">
                            {{ t("game.ui.menu.MenuBar.no_assets") }}
                        </div>
                    </div>
                </div>
                <!-- NOTES -->
                <button class="menu-accordion" @click="toggleNoteManager">
                    {{ t("common.notes") }}
                </button>
                <!-- DM SETTINGS -->
                <button class="menu-accordion" @click="openDmSettings">
                    {{ t("game.ui.menu.MenuBar.dm_settings") }}
                </button>
                <!-- GAMEBOARD SETTINGS -->
                <button v-if="hasGameboardClients" class="menu-accordion" @click="openLgSettings">
                    {{ t("game.ui.menu.MenuBar.gameboard_settings") }}
                </button>
                <!-- PLAYERS -->
                <button class="menu-accordion">Players</button>
                <div class="menu-accordion-panel">
                    <div id="menu-players" class="menu-accordion-subpanel">
                        <template v-for="info of clientInfo" :key="info.client">
                            <div v-if="info.player.name !== username" style="cursor: pointer">
                                <div class="menu-accordion-subpanel-text" @click="jumpToClient(info.client)">
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

            <!-- AUDIO PLAYER-->
            
                <button class="menu-accordion">
                        {{ t("game.ui.menu.MenuBar.audio_player") }}  <!-- ou bien : "Audio" directement -->
                </button>
                <div id="menu-audio" class="menu-accordion-panel" style="position: relative">
                        <!-- Audio panel content -->
                        <template v-if="gameState.isDmOrFake.value">
                            <p>Preview : </p>
                            <p>
                                <select class="audio-perview-select" v-model="selectedPreviewAudioHash">
                                    <option v-for="asset in audioAssets" :key="asset.id" :value="asset.hash">
                                        {{ asset.name }}
                                    </option>
                                </select>
                                <button class="audio-preview-button" @click="playPreviewAudio(selectedPreviewAudioHash)">Play</button>
                            </p>
                            <audio id="AdminPreviewAudioPlayer" controls style="width: 100%;">
                                    <source id="AdminPreviewAudioSource" src="" type="audio/mpeg">
                                    Your browser does not support the audio element.
                                </audio>
                            
                            <div class="audio-player">
                                <p class="audio-title">Now Playing</p>
                                
                                
                                
                                <div class="audio-selector">
                                    <p>
                                        <select class="audio-perview-select" v-model="selectedAudioHash">
                                            <option v-for="asset in audioAssets" :key="asset.id" :value="asset.hash">
                                                {{ asset.name }}
                                            </option>
                                        </select>
                                    </p>
                                </div>
                                <div class="audio-controls">
                                <button class="play-button" @click="playAudioForRoom('play', selectedAudioHash)">Play</button>
                                <button class="stop-button" @click="stopAudioForRoom('stop')">Stop</button>
                                <button class="loop-button" @click="toggleLoopAudioForRoom('toggleLoop')">Loop {{ isAudioLooping ? 'OFF' : 'ON' }}</button>
                                </div>
                            </div>
                        </template>

                        <!-- Audio player for clients -->
                        <template v-if="!gameState.isDmOrFake.value">
                            <audio id="clientAudioPlayer" controls >
                                <source id="clientAudioSource" src="" type="audio/mpeg">
                                Your browser does not support the audio element.
                            </audio>
                        </template>
                </div>
            
            <!-- END AUDIO PLAYER -->
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

.menu-accordion-active + #menu-audio {
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

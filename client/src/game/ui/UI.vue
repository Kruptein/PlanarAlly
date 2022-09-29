<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";

import MarkdownModal from "../../core/components/modals/MarkdownModal.vue";
import SliderComponent from "../../core/components/slider/SliderComponent.vue";
import { baseAdjust } from "../../core/http";
import { getGameState } from "../../store/_game";
import { activeShapeStore } from "../../store/activeShape";
import { coreStore } from "../../store/core";
import { positionSystem } from "../systems/position";
import { positionState } from "../systems/position/state";

import Annotation from "./Annotation.vue";
import DefaultContext from "./contextmenu/DefaultContext.vue";
import ShapeContext from "./contextmenu/ShapeContext.vue";
import { showDefaultContextMenu, showShapeContextMenu } from "./contextmenu/state";
import DiceResults from "./dice/DiceResults.vue";
import LgDiceResults from "./dice/LgDiceResults.vue";
import Floors from "./Floors.vue";
import Initiative from "./initiative/Initiative.vue";
import { initiativeStore } from "./initiative/state";
import LgGridId from "./lg/GridId.vue";
import LocationBar from "./menu/LocationBar.vue";
import MenuBar from "./menu/MenuBar.vue";
import SelectionInfo from "./SelectionInfo.vue";
import ClientSettings from "./settings/client/ClientSettings.vue";
import DmSettings from "./settings/dm/DmSettings.vue";
import FloorSettings from "./settings/FloorSettings.vue";
import LgSettings from "./settings/lg/LgSettings.vue";
import LocationSettings from "./settings/location/LocationSettings.vue";
import ShapeSettings from "./settings/shape/ShapeSettings.vue";
import CreateTokenDialog from "./tokendialog/CreateTokenDialog.vue";
import { tokenDialogVisible } from "./tokendialog/state";
import Tools from "./tools/Tools.vue";

const hasGameboard = coreStore.state.boardId !== undefined;

const uiEl = ref<HTMLDivElement | null>(null);

const coreState = coreStore.state;
const { t } = useI18n();

const visible = reactive({
    locations: false,
    settings: false,
});
const topLeft = computed(() => visible.locations && visible.settings);

const changelogText = computed(() =>
    t("game.ui.ui.changelog_RELEASE_LOG", {
        release: coreState.version.release,
        log: coreState.changelog,
    }),
);

const releaseVersion = computed(() => coreState.version.release);

const showChangelog = computed(() => {
    if (hasGameboard) return false;
    const version = localStorage.getItem("last-version");
    if (version !== coreState.version.release) {
        localStorage.setItem("last-version", coreState.version.release);
        return true;
    }
    return false;
});

onMounted(() => {
    // hide all UI elements that were previously open
    activeShapeStore.setShowEditDialog(false);
    initiativeStore.show(false);
    showDefaultContextMenu.value = false;
    showShapeContextMenu.value = false;
    tokenDialogVisible.value = false;
});

function toggleLocations(): void {
    const oldState = visible.locations;
    // Split up visible.locations setting to smooth in/out overflow fix
    if (oldState) visible.locations = false;
    let i = 0;
    const interval = setInterval(() => {
        if (uiEl.value === null) return;
        i += 0.625;
        uiEl.value.style.gridTemplateRows = `${!oldState ? i : 6.25 - i}rem auto 1fr auto`;
        if (i >= 6.25) {
            clearInterval(interval);
            // Force height to become auto instead of harcoding it to 100px
            uiEl.value.style.gridTemplateRows = `${!oldState ? "auto" : 0} auto 1fr auto`;
            if (!oldState) visible.locations = true;
        }
    }, 20);
}

function toggleMenu(): void {
    visible.settings = !visible.settings;
    let i = 0;
    const interval = setInterval(() => {
        if (uiEl.value === null) return;
        i += 0.625;
        uiEl.value.style.gridTemplateColumns = `${visible.settings ? i : 12.5 - i}rem repeat(3, 1fr)`;
        if (i >= 12.5) {
            clearInterval(interval);
        }
    }, 20);
}

const zoomDisplay = computed({
    get(): number {
        return positionState.reactive.zoomDisplay;
    },
    set(zoom: number) {
        positionSystem.setZoomDisplay(zoom, { invalidate: true, updateSectors: true, sync: true });
    },
});

function setTempZoomDisplay(value: number): void {
    positionSystem.setZoomDisplay(value, { invalidate: true, updateSectors: true, sync: false });
}
</script>

<template>
    <div id="ui" ref="uiEl" v-show="getGameState().showUi">
        <div id="logo" v-show="topLeft">
            <div id="logo-icons">
                <a href="https://www.planarally.io" target="_blank" rel="noopener noreferrer">
                    <img :src="baseAdjust('/static/favicon.png')" alt="" />
                </a>
                <div id="logo-links">
                    <a
                        href="https://github.com/kruptein/PlanarAlly"
                        target="_blank"
                        :title="t('game.ui.ui.github_msg')"
                        rel="noopener noreferrer"
                    >
                        <font-awesome-icon :icon="['fab', 'github']" />
                    </a>
                    <a
                        href="https://discord.gg/mubGnTe"
                        target="_blank"
                        :title="t('game.ui.ui.discord_msg')"
                        rel="noopener noreferrer"
                    >
                        <font-awesome-icon :icon="['fab', 'discord']" />
                    </a>
                    <a
                        href="https://www.patreon.com/planarally"
                        target="_blank"
                        :title="t('game.ui.ui.patreon_msg')"
                        rel="noopener noreferrer"
                    >
                        <font-awesome-icon :icon="['fab', 'patreon']" />
                    </a>
                </div>
            </div>
            <div id="logo-version">
                <span>{{ t("common.version") }}</span>
                <span>{{ releaseVersion }}</span>
            </div>
        </div>
        <!-- RADIAL MENU -->
        <div id="radialmenu">
            <div class="rm-wrapper">
                <div class="rm-toggler">
                    <ul class="rm-list" :class="{ 'rm-list-dm': getGameState().isDm }">
                        <li
                            @click="toggleLocations"
                            v-if="getGameState().isDm"
                            class="rm-item"
                            id="rm-locations"
                            :title="t('game.ui.ui.open_loc_menu')"
                        >
                            <a href="#">
                                <font-awesome-icon :icon="['far', 'compass']" />
                            </a>
                        </li>
                        <li @click="toggleMenu" class="rm-item" id="rm-settings" :title="t('game.ui.ui.open_settings')">
                            <a href="#">
                                <font-awesome-icon icon="cog" />
                            </a>
                        </li>
                    </ul>
                </div>
                <span class="rm-topper"></span>
            </div>
        </div>
        <MenuBar />
        <Tools />
        <LocationBar v-if="getGameState().isDm" :active="visible.locations" :menuActive="visible.settings" />
        <Floors />
        <CreateTokenDialog />
        <Initiative />
        <DefaultContext />
        <ShapeContext />
        <ShapeSettings />
        <DmSettings v-if="getGameState().isDm || getGameState().isFakePlayer" />
        <LgSettings v-if="getGameState().isDm || getGameState().isFakePlayer" />
        <LgGridId v-if="hasGameboard" />
        <FloorSettings v-if="getGameState().isDm || getGameState().isFakePlayer" />
        <LocationSettings v-if="getGameState().isDm || getGameState().isFakePlayer" />
        <ClientSettings />
        <SelectionInfo />
        <Annotation />
        <template v-if="!hasGameboard"><DiceResults /></template>
        <template v-else><LgDiceResults /></template>
        <div id="teleport-modals"></div>
        <MarkdownModal v-if="showChangelog" :title="t('game.ui.ui.new_ver_msg')" :source="changelogText" />
        <!-- When updating zoom boundaries, also update store updateZoom function;
            should probably do this using a store variable-->
        <SliderComponent
            v-if="!hasGameboard"
            id="zoom"
            height="6px"
            width="200px"
            :dot-size="[8, 20]"
            :rail-style="{ backgroundColor: '#fff', 'box-shadow': '0.5px 0.5px 3px 1px rgba(0, 0, 0, .36)' }"
            :dot-style="{ 'border-radius': '15%' }"
            :min="0"
            :max="1"
            v-model="zoomDisplay"
            @change="setTempZoomDisplay"
        />
    </div>
</template>

<style scoped lang="scss">
#ui {
    pointer-events: none;
    position: absolute;
    display: grid;
    grid-template-areas:
        "topleft locations locations locations"
        "menu    menutoggle  annotation   zoom     "
        "menu        .       .              .      "
        "menu      layer     .            tools    ";
    grid-template-rows: 0 auto 1fr auto;
    grid-template-columns: 0 repeat(3, 1fr);
    width: 100%;
    height: 100%;

    z-index: 0;
}

#logo {
    pointer-events: auto;
    grid-area: topleft;
    background-color: #fa5a5a;
    display: flex;
    align-items: center;
}

#logo-icons {
    flex: 1 1 0px;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-evenly;

    > a {
        display: contents;

        > img {
            display: block;
            max-width: 45%;
        }
    }
}

#logo-links {
    display: flex;
    justify-content: space-evenly;

    > a {
        padding: 0 3px;
    }
}

#logo-version {
    flex: 1 1 0px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

#zoom {
    pointer-events: auto;
    justify-self: end;
    top: 1rem;
    right: 1.6rem;
    grid-area: zoom;
}

#radialmenu {
    grid-area: menutoggle;
    z-index: -1;
}

.rm-item {
    pointer-events: auto;
}

/* The svg is added by Font Awesome */

.rm-list-dm #rm-locations svg {
    margin-left: 3rem;
}

.rm-list-dm #rm-settings svg {
    margin-bottom: 3rem;
}

/* https://codepen.io/jonigiuro/pen/kclIu/ */

.rm-wrapper {
    position: relative;
    width: 12.5rem;
    height: 12.5rem;
    top: -6.25rem;
    left: -6.25rem;

    .rm-topper {
        pointer-events: none;
        text-align: center;
        line-height: 3rem;
        font-size: 1.6em;
    }

    .rm-toggler,
    .rm-topper {
        display: block;
        position: absolute;
        width: 3rem;
        height: 3rem;
        left: 50%;
        top: 50%;
        margin-left: -1.6rem;
        margin-top: -1.6rem;
        background: #fa5a5a;
        color: white;
        border-radius: 50%;

        .rm-list {
            opacity: 0.5;
            list-style: none;
            padding: 0;
            width: 12.5rem;
            height: 12.5rem;
            overflow: hidden;
            display: block;
            border-radius: 50%;
            transform: rotate(180deg);
            box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.2);
            margin: -4.7rem 0 0 -4.7rem;

            .rm-item {
                display: table;
                width: 50%;
                height: 50%;
                float: left;
                text-align: center;
                box-shadow: inset 0 0 2px 0 rgba(0, 0, 0, 0.2);
                background-color: white;

                &:hover {
                    background-color: #82c8a0;

                    a {
                        color: white;
                    }
                }

                a {
                    display: table-cell;
                    vertical-align: middle;
                    transform: rotate(-45deg);
                    text-decoration: none;
                    font-size: 1.6em;
                    color: #82c8a0;
                    border: none;
                    outline: none;
                }
            }
        }

        &:hover .rm-list {
            opacity: 1;
        }
    }
}

.rm-list-dm {
    transform: rotate(135deg) !important; /* total deg: 135 */
}

.settingsfade-enter-active,
.settingsfade-leave-active {
    transition: width 500ms;
}
.settingsfade-leave-to,
.settingsfade-enter {
    width: 0;
}
.settingsfade-enter-to,
.settingsfade-leave {
    width: 200px;
}
</style>

<style lang="scss">
.slider-checkbox {
    display: block;
    box-sizing: border-box;
    border: none;
    color: inherit;
    background: none;
    font: inherit;
    line-height: inherit;
    text-align: left;
    position: relative;
    outline: none;
    width: 2.6em;
    padding: 0.4em 0 0.4em 0.4em;

    &:hover {
        cursor: pointer;

        &::before {
            box-shadow: 0 0 0.5em #333;
        }

        &::after {
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='50' cy='50' r='50' fill='rgba(0,0,0,.25)'/%3E%3C/svg%3E");
            background-size: 30%;
            background-repeat: no-repeat;
            background-position: center center;
        }
    }

    &::before,
    &::after {
        content: "";
        position: absolute;
        height: 1.1em;
        transition: all 0.25s ease;
        left: 0;
    }

    &::before {
        width: 2.6em;
        border: 0.2em solid #767676;
        top: -0.2em;
        background: #767676;
        border-radius: 1.1em;
    }

    &::after {
        background-color: #fff;
        background-position: center center;
        border-radius: 50%;
        width: 1.1em;
        border: 0.15em solid #767676;
        top: -0.15em;
    }

    &[aria-pressed="true"] {
        &::after {
            left: 1.6em;
            border-color: #36a829;
            color: #36a829;
        }

        &::before {
            background-color: #36a829;
            border-color: #36a829;
        }
    }
}
</style>

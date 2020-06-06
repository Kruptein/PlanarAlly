<script lang="ts">
import Vue from "vue";
import vueSlider from "vue-slider-component";
import "vue-slider-component/theme/default.css";
import Component from "vue-class-component";

import { mapState } from "vuex";

import DmSettings from "@/game/ui/settings/dm/DmSettings.vue";
import FloorSelect from "@/game/ui/floors.vue";
import LocationBar from "./menu/locations.vue";
import LocationSettings from "@/game/ui/settings/location/LocationSettings.vue";
import MarkdownModal from "@/core/components/modals/MarkdownModal.vue";
import MenuBar from "@/game/ui/menu/menu.vue";
import SelectionInfo from "@/game/ui/selection/selection_info.vue";
import Tools from "@/game/ui/tools/tools.vue";

import { LocalPoint } from "../geom";
import { gameStore } from "../store";
import { l2g } from "../units";
import { coreStore } from "../../core/store";

@Component({
    components: {
        DmSettings,
        FloorSelect,
        LocationBar,
        LocationSettings,
        MarkdownModal,
        MenuBar,
        SelectionInfo,
        Tools,
        vueSlider,
    },
    computed: {
        ...mapState("game", ["locations"]),
    },
})
export default class UI extends Vue {
    $refs!: {
        tools: InstanceType<typeof Tools>;
    };

    visible = {
        locations: false,
        settings: false,
        topleft: false,
    };

    get version(): { release: string; env: string } {
        return coreStore.version;
    }

    get changelog(): string {
        return coreStore.changelog;
    }

    get FAKE_PLAYER(): boolean {
        return gameStore.FAKE_PLAYER;
    }

    get IS_DM(): boolean {
        return gameStore.IS_DM;
    }

    get showUI(): boolean {
        return gameStore.showUI;
    }

    get zoomDisplay(): number {
        return gameStore.zoomDisplay;
    }

    set zoomDisplay(value: number) {
        gameStore.updateZoom({
            newZoomDisplay: value,
            zoomLocation: l2g(new LocalPoint(window.innerWidth / 2, window.innerHeight / 2)),
        });
    }

    get showChangelog(): boolean {
        const version = localStorage.getItem("last-version");
        if (version !== coreStore.version.release) {
            localStorage.setItem("last-version", coreStore.version.release);
            return true;
        }
        return false;
    }

    toggleMenu(_el: any): void {
        this.visible.settings = !this.visible.settings;
        if (this.visible.locations && this.visible.settings) this.visible.topleft = true;
        const uiEl = <HTMLDivElement>this.$el;
        let i = 0;
        const interval = setInterval(() => {
            i += 10;
            uiEl.style.gridTemplateColumns = `${this.visible.settings ? i : 200 - i}px repeat(3, 1fr)`;
            if (i >= 200) {
                clearInterval(interval);
                if (!this.visible.settings) this.visible.topleft = false;
            }
        }, 20);
    }

    toggleLocations(_el: any): void {
        const oldState = this.visible.locations;
        // Split up visible.locations setting to smooth in/out overflow fix
        if (oldState) this.visible.locations = false;
        const uiEl = <HTMLDivElement>this.$el;
        let i = 0;
        const interval = setInterval(() => {
            i += 10;
            uiEl.style.gridTemplateRows = `${!oldState ? i : 100 - i}px auto 1fr auto`;
            if (i >= 100) {
                clearInterval(interval);
                // Force height to become auto instead of harcoding it to 100px
                uiEl.style.gridTemplateRows = `${!oldState ? "auto" : 0} auto 1fr auto`;
                if (!oldState) this.visible.locations = true;
                if (this.visible.locations && this.visible.settings) this.visible.topleft = true;
                if (!this.visible.locations) this.visible.topleft = false;
            }
        }, 20);
    }
}
</script>

<template>
    <div id="ui" v-show="showUI">
        <div id="logo" v-show="visible.topleft">
            <div id="logo-icons">
                <a href="https://www.planarally.io" target="_blank" rel="noopener noreferrer">
                    <img src="/static/favicon.png" alt="" />
                </a>
                <div id="logo-links">
                    <a
                        href="https://github.com/kruptein/PlanarAlly"
                        target="_blank"
                        :title="$t('game.ui.ui.github_msg')"
                        rel="noopener noreferrer"
                    >
                        <i aria-hidden="true" class="fab fa-github"></i>
                    </a>
                    <a
                        href="https://discord.gg/mubGnTe"
                        target="_blank"
                        :title="$t('game.ui.ui.discord_msg')"
                        rel="noopener noreferrer"
                    >
                        <i aria-hidden="true" class="fab fa-discord"></i>
                    </a>
                    <a
                        href="https://www.patreon.com/planarally"
                        target="_blank"
                        :title="$t('game.ui.ui.patreon_msg')"
                        rel="noopener noreferrer"
                    >
                        <i aria-hidden="true" class="fab fa-patreon"></i>
                    </a>
                </div>
            </div>
            <div id="logo-version">
                <span v-t="'common.version'"></span>
                <span>{{ version.release }}</span>
            </div>
        </div>
        <!-- RADIAL MENU -->
        <div id="radialmenu">
            <div class="rm-wrapper">
                <div class="rm-toggler">
                    <ul class="rm-list" :class="{ 'rm-list-dm': IS_DM }">
                        <li
                            @click="toggleLocations"
                            v-if="IS_DM"
                            class="rm-item"
                            id="rm-locations"
                            :title="$t('game.ui.ui.open_loc_menu')"
                        >
                            <a href="#">
                                <i aria-hidden="true" class="far fa-compass"></i>
                            </a>
                        </li>
                        <li
                            @click="toggleMenu"
                            class="rm-item"
                            id="rm-settings"
                            :title="$t('game.ui.ui.open_settings')"
                        >
                            <a href="#">
                                <i aria-hidden="true" class="fas fa-cog"></i>
                            </a>
                        </li>
                    </ul>
                </div>
                <span class="rm-topper">
                    <i aria-hidden="true" class="icon-share-alt"></i>
                </span>
            </div>
        </div>
        <MenuBar></MenuBar>
        <LocationBar :active="visible.locations"></LocationBar>
        <Tools ref="tools"></Tools>
        <FloorSelect></FloorSelect>
        <SelectionInfo></SelectionInfo>
        <DmSettings ref="dmsettings" v-if="IS_DM || FAKE_PLAYER"></DmSettings>
        <LocationSettings v-if="IS_DM || FAKE_PLAYER"></LocationSettings>
        <MarkdownModal v-if="showChangelog" :title="$t('game.ui.ui.new_ver_msg')">
            {{ $t("game.ui.ui.changelog_RELEASE_LOG", { release: version.release, log: changelog }) }}
        </MarkdownModal>
        <!-- When updating zoom boundaries, also update store updateZoom function;
            should probably do this using a store variable-->
        <vueSlider
            id="zoom"
            v-model="zoomDisplay"
            :height="6"
            :width="200"
            :min="0"
            :max="1"
            :interval="0.1"
            :dot-size="[8, 20]"
            :dot-options="{ style: { 'border-radius': '15%', 'z-index': 11 } }"
            :tooltip-placement="'bottom'"
            :tooltip="'focus'"
            :tooltip-formatter="zoomDisplay.toFixed(1)"
            :rail-style="{ 'background-color': '#fff', 'box-shadow': '0.5px 0.5px 3px 1px rgba(0, 0, 0, .36)' }"
            :process-style="{ 'background-color': '#fff' }"
        ></vueSlider>
    </div>
</template>

<style scoped>
#ui {
    pointer-events: none;
    position: absolute;
    display: grid;
    grid-template-areas:
        "topleft locations locations locations"
        "menu    menutoggle  .       zoom     "
        "menu        .       .         .      "
        "menu      layer     .       tools    ";
    grid-template-rows: 0 auto 1fr auto;
    grid-template-columns: 0 repeat(3, 1fr);
    width: 100%;
    height: 100%;
    z-index: 10;
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
}

#logo-icons > a {
    display: contents;
}

#logo-icons > a > img {
    display: block;
    max-width: 45%;
}

#logo-links {
    display: flex;
    justify-content: space-evenly;
}

#logo-links > a {
    padding: 0 3px;
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
    top: 15px;
    right: 25px;
    grid-area: zoom;
}

#radialmenu {
    z-index: -1;
    grid-area: menutoggle;
}

.rm-item {
    pointer-events: auto;
}

/* The svg is added by Font Awesome */

.rm-list-dm #rm-locations svg {
    margin-left: 50px;
}

.rm-list-dm #rm-settings svg {
    margin-bottom: 50px;
}

/* https://codepen.io/jonigiuro/pen/kclIu/ */

.rm-wrapper {
    position: relative;
    width: 200px;
    height: 200px;
    top: -100px;
    left: -100px;
}

.rm-wrapper .rm-topper {
    pointer-events: none;
    text-align: center;
    line-height: 50px;
    font-size: 25px;
}

.rm-wrapper .rm-toggler,
.rm-wrapper .rm-topper {
    display: block;
    position: absolute;
    width: 50px;
    height: 50px;
    left: 50%;
    top: 50%;
    margin-left: -25px;
    margin-top: -25px;
    background: #fa5a5a;
    color: white;
    border-radius: 50%;
}

.rm-wrapper .rm-toggler .rm-list,
.rm-wrapper .rm-topper .rm-list {
    opacity: 0.5;
    list-style: none;
    padding: 0;
    width: 200px;
    height: 200px;
    overflow: hidden;
    display: block;
    border-radius: 50%;
    transform: rotate(180deg);
    box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.2);
    margin: -75px 0 0 -75px;
}

.rm-list-dm {
    transform: rotate(135deg) !important; /* total deg: 135 */
}

.rm-wrapper .rm-toggler:hover .rm-list,
.rm-wrapper .rm-topper:hover .rm-list {
    opacity: 1;
}

.rm-wrapper .rm-toggler .rm-list .rm-item,
.rm-wrapper .rm-topper .rm-list .rm-item {
    display: table;
    width: 50%;
    height: 50%;
    float: left;
    text-align: center;
    box-shadow: inset 0 0 2px 0 rgba(0, 0, 0, 0.2);
    background-color: white;
}

.rm-wrapper .rm-toggler .rm-list .rm-item:hover,
.rm-wrapper .rm-topper .rm-list .rm-item:hover {
    background-color: #82c8a0;
}

.rm-wrapper .rm-toggler .rm-list .rm-item:hover a,
.rm-wrapper .rm-topper .rm-list .rm-item:hover a {
    color: white;
}

.rm-wrapper .rm-toggler .rm-list .rm-item a,
.rm-wrapper .rm-topper .rm-list .rm-item a {
    display: table-cell;
    vertical-align: middle;
    transform: rotate(-45deg);
    text-decoration: none;
    font-size: 25px;
    color: #82c8a0;
    border: none;
    outline: none;
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

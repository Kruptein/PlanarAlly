<template>
    <div id="menuContainer">
        <!-- RADIAL MENU -->
        <div
            id="radialmenu"
            ref="rm"
            :style="{
                left: visible.settings ? '200px' : '0',
                top: visible.locations ? '100px' : '0',
            }"
        >
            <div class="rm-wrapper">
                <div class="rm-toggler">
                    <ul class="rm-list" :class="{ 'rm-list-dm': IS_DM }">
                        <li
                            @click="visible.locations = !visible.locations"
                            v-if="IS_DM"
                            class="rm-item"
                            id="rm-locations"
                        >
                            <a href="#">
                                <i class="far fa-compass"></i>
                            </a>
                        </li>
                        <li @click="visible.settings = !visible.settings" class="rm-item" id="rm-settings">
                            <a href="#">
                                <i class="fas fa-cog"></i>
                            </a>
                        </li>
                    </ul>
                </div>
                <span class="rm-topper">
                    <i class="icon-share-alt"></i>
                </span>
            </div>
        </div>
        <!-- SETTINGS -->
        <transition name="settings" @enter="$refs.rm.style.transition = 'left 500ms'">
            <div id="menu" v-if="visible.settings" @click="settingsClick" ref="settings">
                <div style="width:200px;height:90%;overflow-y:auto;overflow-x:hidden;">
                    <!-- ASSETS -->
                    <template v-if="IS_DM">
                        <button class="menu-accordion">Assets</button>
                        <div class="menu-accordion-panel">
                            <a class="actionButton" href="/assets" target="blank" title="Open asset manager">
                                <i class="fas fa-external-link-alt"></i>
                            </a>
                            <div class="directory" id="menu-tokens">
                                <asset-node :asset="assets"></asset-node>
                                <div v-if="!assets">No assets</div>
                            </div>
                        </div>
                        <!-- NOTES -->
                        <button class="menu-accordion">Notes</button>
                        <div class="menu-accordion-panel">
                            <div class="menu-accordion-subpanel" id="menu-notes">
                                <a class="actionButton" @click="createNote">
                                    <i class="far fa-plus-square"></i>
                                </a>
                                <div
                                    v-for="note in notes"
                                    :key="note.uuid"
                                    @click="openNote(note)"
                                    style="cursor:pointer"
                                >
                                    {{ note.title || "[?]" }}
                                </div>
                                <div v-if="!notes.length">No notes</div>
                            </div>
                        </div>
                        <!-- DM OPTIONS -->
                        <button class="menu-accordion" @click="openDmSettings">DM Options</button>
                    </template>
                    <!-- CLIENT OPTIONS -->
                    <button class="menu-accordion">Client Options</button>
                    <div class="menu-accordion-panel">
                        <div class="menu-accordion-subpanel">
                            <label for="gridColour">Grid Colour:</label>
                            <color-picker id="gridColour" :color.sync="gridColour" />
                            <label for="fowColour">FOW Colour:</label>
                            <color-picker id="fowColour" :color.sync="fowColour" />
                            <label for="rulerColour">Ruler Colour:</label>
                            <color-picker id="rulerColour" :color.sync="rulerColour" />
                        </div>
                    </div>
                </div>
                <router-link
                    to="/dashboard"
                    class="menu-accordion"
                    style="text-decoration:none;display:inline-block;position:absolute;bottom:0;"
                >
                    Exit
                </router-link>
            </div>
        </transition>
        <!-- LOCATIONS -->
        <transition name="locations" @enter="$refs.rm.style.transition = 'top 500ms'">
            <div id="locations-menu" v-if="IS_DM && visible.locations">
                <div>
                    <div
                        v-for="location in locations"
                        :key="location"
                        :style="[getCurrentLocation() === location ? { 'background-color': '#82c8a0' } : {}]"
                        @click="changeLocation(location)"
                    >
                        {{ location }}
                    </div>
                    <div @click="createLocation">
                        <i class="fas fa-plus"></i>
                    </div>
                </div>
            </div>
        </transition>
        <img id="dragImage" />
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import { mapState } from "vuex";

import ColorPicker from "@/core/components/colorpicker.vue";
import Game from "@/game/game.vue";
import AssetNode from "@/game/ui/menu/asset_node.vue";

import { uuidv4 } from "@/core/utils";
import { socket } from "@/game/api/socket";
import { Note } from "@/game/comm/types/general";
import { gameStore } from "@/game/store";
import { EventBus } from "../../event-bus";

@Component({
    components: {
        "color-picker": ColorPicker,
        "asset-node": AssetNode,
    },
    computed: {
        ...mapState("game", ["locations", "assets", "notes"]),
    },
})
export default class MenuBar extends Vue {
    visible = {
        settings: false,
        locations: false,
    };

    get IS_DM(): boolean {
        return gameStore.IS_DM || gameStore.FAKE_PLAYER;
    }
    get gridColour(): string {
        return gameStore.gridColour;
    }
    set gridColour(value: string) {
        gameStore.setGridColour({ colour: value, sync: true });
    }
    get fowColour(): string {
        return gameStore.fowColour;
    }
    set fowColour(value: string) {
        gameStore.setFOWColour({ colour: value, sync: true });
    }
    get rulerColour(): string {
        return gameStore.rulerColour;
    }
    set rulerColour(value: string) {
        gameStore.setRulerColour({ colour: value, sync: true });
    }
    settingsClick(event: { target: HTMLElement }): void {
        if (event.target.classList.contains("menu-accordion")) {
            event.target.classList.toggle("menu-accordion-active");
            const next = <HTMLElement>event.target.nextElementSibling;
            if (next !== null) next.style.display = next.style.display === "" ? "block" : "";
        }
    }
    getCurrentLocation(): string {
        return gameStore.locationName;
    }
    changeLocation(name: string): void {
        socket.emit("Location.Change", name);
    }
    async createLocation(): Promise<void> {
        const value = await (<Game>this.$parent).$refs.prompt.prompt(`New location name:`, `Create new location`);
        socket.emit("Location.New", value);
    }
    createNote(): void {
        const note = { title: "New note", text: "", uuid: uuidv4() };
        gameStore.newNote({ note, sync: true });
        this.openNote(note);
    }
    openNote(note: Note): void {
        (<Game>this.$parent).$refs.note.open(note);
    }

    openDmSettings(): void {
        EventBus.$emit("DmSettings.Open");
    }
}
</script>

<style scoped>
/*
DIRECTORY.CSS changes

* Collapse all folders by default, use js to toggle visibility on click.
* On hover over folder show some visual feedback
* On hover over file show the image

*/
.folder > * {
    display: none;
}

.directory > .folder,
.directory > .file {
    display: block;
}

.folder:hover {
    font-weight: bold;
    cursor: pointer;
}

.folder:hover > * {
    font-weight: normal;
}

#menuContainer {
    position: absolute;
    z-index: 20;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    pointer-events: none;
}

#menu {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    z-index: 21;
    background-color: #fa5a5a;
    overflow: auto;
    pointer-events: auto;
    max-width: 200px;
}

#locations-menu {
    position: absolute;
    top: 0;
    left: 0;
    max-height: 100px;
    width: 100%;
    z-index: 21;
    background-color: #fa5a5a;
    overflow: auto;
    pointer-events: auto;
}

#locations-menu > div {
    display: flex;
    width: 100%;
    height: 100%;
}

#locations-menu > div > div {
    background-color: white;
    text-align: center;
    line-height: 100px;
    width: 100px;
    border-right: solid 1px #82c8a0;
}

#locations-menu > div > div:hover {
    cursor: pointer;
    background-color: #82c8a0;
}

.actionButton {
    position: absolute;
    right: 0;
    margin: 5px;
    margin-right: 10px;
    padding: 0;
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

.menu-accordion-subpanel {
    display: flex;
    flex-direction: column;
    width: 100%;
}

.menu-accordion-subpanel > * {
    padding: 5px;
    display: flex;
    justify-content: space-evenly;
    align-items: center;
}

.menu-accordion-subpanel > *:hover {
    background-color: #82c8a0;
}

#exitButton {
    position: fixed;
    bottom: 0px;
    width: 100%;
}

#radialmenu {
    position: absolute;
    z-index: 20;
    width: 0;
    height: 0;
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

.settings-enter-active,
.settings-leave-active {
    transition: width 500ms;
}
.settings-leave-to,
.settings-enter {
    width: 0;
}
.settings-enter-to,
.settings-leave {
    width: 200px;
}

.locations-enter-active,
.locations-leave-active {
    transition: height 500ms;
}
.locations-leave-to,
.locations-enter {
    height: 0;
}
.locations-enter-to,
.locations-leave {
    height: 100px;
}
</style>

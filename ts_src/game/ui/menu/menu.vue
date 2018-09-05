<template>
    <div id='menuContainer'>
        <!-- RADIAL MENU -->
        <div
            id="radialmenu"
            ref="rm"
            :style="{
                left: visible.settings ? '200px' : '0',
                top: visible.locations ? '100px' : '0'
            }"
        >
            <div class="rm-wrapper">
                <div class="rm-toggler">
                    <ul 
                        class="rm-list"
                        :class="{ 'rm-list-dm': IS_DM }"
                    >
                        <li
                            @click="visible.locations = !visible.locations"
                            v-if="IS_DM"
                            class="rm-item"
                            id="rm-locations"
                        >
                            <a href="#"><i class="far fa-compass"></i></a>
                        </li>
                        <li
                            @click="visible.settings = !visible.settings"
                            class="rm-item"
                            id="rm-settings"
                        >
                            <a href="#"><i class="fas fa-cog"></i></a>
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
            <div id="menu" v-if="visible.settings" @click="settingsClick">
                <div style='width:100%;height:90%;overflow-y:auto;overflow-x:hidden;'>
                    <!-- ASSETS -->
                    <template v-if="IS_DM">
                        <button class="accordion">Assets</button>
                        <div class="accordion-panel">
                            <a class='actionButton' href="/assets/" target='blank'><i class="fas fa-external-link-alt"></i></a>
                            <div class="directory" id="menu-tokens">
                                <asset-node :asset="assets"></asset-node>
                            </div>
                        </div>
                        <!-- NOTES -->
                        <button class="accordion">Notes</button>
                        <div class="accordion-panel">
                            <div class="accordion-subpanel" id="menu-notes">
                                <a class='actionButton' @click='createNote'><i class="far fa-plus-square"></i></a>
                                <div
                                    v-for="note in notes"
                                    :key="note.uuid"
                                    @click='openNote(note)'
                                    style='cursor:pointer'
                                >
                                    {{ note.name || "[?]" }}
                                </div>
                                <div v-if='!notes.length'>
                                    No notes
                                </div>
                            </div>
                        </div>
                        <!-- DM OPTIONS -->
                        <button class="accordion">DM Options</button>
                        <div class="accordion-panel">
                            <div class="accordion-subpanel">
                                <label for="useGridInput">Use grid: </label>
                                <input id="useGridInput" type="checkbox" checked="checked" v-model="useGrid">
                                <label for="useFOWInput">Fill entire canvas with FOW: </label>
                                <input id="useFOWInput" type="checkbox" v-model="fullFOW">
                                <label for="fowOpacity">FOW opacity: </label>
                                <input id="fowOpacity" type="number" min="0" max="1" step="0.1" v-model.number="fowOpacity">
                                <label for="fowLOS">Only show lights in LoS: </label>
                                <input id="fowLOS" type="checkbox" v-model='fowLOS'>
                                <label for="unitSizeInput">Unit Size (in ft.): </label>
                                <input id="unitSizeInput" type="number" v-model.number="unitSize">
                                <label for="gridSizeInput">Grid Size (in pixels): </label>
                                <input id="gridSizeInput" type="number" min="0" v-model.number="gridSize">
                                <label for="invitation">Invitation Code: </label>
                                <input id="invitation" type="text" :value="invitationCode" readonly="readonly">
                            </div>
                        </div>
                    </template>
                    <!-- CLIENT OPTIONS -->
                    <button class="accordion">Client Options</button>
                    <div class="accordion-panel">
                        <div class="accordion-subpanel">
                            <label for="gridColour">Grid Colour: </label>
                            <color-picker id="gridColour" :color.sync="gridColour" />
                            <label for="fowColour">FOW Colour: </label>
                            <color-picker id="fowColour" :color.sync="fowColour" />
                        </div>
                    </div>
                </div>
                <a href="/rooms" class="accordion" style='text-decoration:none;display:inline-block;position:absolute;bottom:0;'>Exit</a>
            </div>
        </transition>
        <!-- LOCATIONS -->
        <transition name="locations" @enter="$refs.rm.style.transition = 'top 500ms'">
            <div id='locations-menu' v-if="IS_DM && visible.locations">
                <div>
                    <div
                        v-for="location in locations"
                        :key="location"
                        @click="changeLocation(location)"
                    >
                        {{ location }}
                    </div>
                    <div @click="createLocation">
                        <i class='fas fa-plus'></i>
                    </div>
                </div>
            </div>
        </transition>
        <img id='dragImage'>
    </div>
</template>


<script lang="ts">
import Vue from "vue";
import colorpicker from "../../../core/components/colorpicker.vue";

import { mapState } from "vuex";

import Settings from "../../settings";
import assetNode from "./asset_node.vue";

import { uuidv4 } from "../../../core/utils";
import { Note } from "../../api_types";
import { vm } from "../../planarally";
import { socket } from "../../socket";

export default Vue.component("menu-bar", {
    components: {
        "color-picker": colorpicker,
        "asset-node": assetNode,
    },
    data: () => ({
        visible: {
            settings: false,
            locations: false,
        },
    }),
    computed: {
        ...mapState(["invitationCode", "IS_DM", "locations", "assets", "notes"]),
        useGrid: {
            get(): boolean {
                return this.$store.state.useGrid;
            },
            set(value: boolean) {
                this.$store.commit("setUseGrid", { useGrid: value, sync: true });
            },
        },
        fullFOW: {
            get(): boolean {
                return this.$store.state.fullFOW;
            },
            set(value: boolean) {
                this.$store.commit("setFullFOW", { fullFOW: value, sync: true });
            },
        },
        fowOpacity: {
            get(): number {
                return this.$store.state.fowOpacity;
            },
            set(value: number) {
                if (typeof value !== "number") return;
                this.$store.commit("setFOWOpacity", { fowOpacity: value, sync: true });
            },
        },
        fowLOS: {
            get(): boolean {
                return this.$store.state.fowLOS;
            },
            set(value: boolean) {
                this.$store.commit("setLineOfSight", { fowLOS: value, sync: true });
            },
        },
        unitSize: {
            get(): number {
                return this.$store.state.unitSize;
            },
            set(value: number) {
                if (typeof value !== "number") return;
                this.$store.commit("setUnitSize", { unitSize: value, sync: true });
            },
        },
        gridSize: {
            get(): number {
                return this.$store.state.gridSize;
            },
            set(value: number) {
                if (typeof value !== "number") return;
                this.$store.commit("setGridSize", { gridSize: value, sync: true });
            },
        },
        gridColour: {
            get(): string {
                return this.$store.state.gridColour;
            },
            set(value: string) {
                this.$store.commit("setGridColour", { colour: value, sync: true });
            },
        },
        fowColour: {
            get(): string {
                return this.$store.state.fowColour;
            },
            set(value: string) {
                this.$store.commit("setFOWColour", { colour: value, sync: true });
            },
        },
    },
    methods: {
        settingsClick(event: { target: HTMLElement }) {
            if (event.target.classList.contains("accordion")) {
                event.target.classList.toggle("accordion-active");
                const next = <HTMLElement>event.target.nextElementSibling!;
                next.style.display = next.style.display === "" ? "block" : "";
            }
        },
        changeLocation(name: string) {
            socket.emit("change location", name);
        },
        createLocation() {
            (<any>vm.$refs.prompt).prompt(`New  location name:`, `Create new location`).then(
                (value: string) => {
                    socket.emit("new location", value);
                },
                () => {},
            );
        },
        createNote() {
            const note = { name: "New note", text: "", uuid: uuidv4() };
            this.$store.commit("addNote", note);
            this.openNote(note);
        },
        openNote(note: Note) {
            (<any>vm.$refs.note).open(note);
        },
    },
});
</script>

<style scoped>
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
    padding: 0;
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

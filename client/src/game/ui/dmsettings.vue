<template>
    <Modal :visible="visible" :colour="'rgba(255, 255, 255, 0.8)'" @close="onClose" :mask="false">
        <div
            class="modal-header"
            slot="header"
            slot-scope="m"
            draggable="true"
            @dragstart="m.dragStart"
            @dragend="m.dragEnd"
        >
            <div>DM Settings</div>
            <div class="header-close" @click="onClose">
                <i class="far fa-window-close"></i>
            </div>
        </div>
        <div class="modal-body" @click="handleClick">
            <div id="categories">
                <div
                    class="category"
                    :class="{ selected: selection === c }"
                    v-for="(category, c) in categories"
                    :key="category"
                    @click="selection = c"
                >
                    {{ category }}
                </div>
            </div>
            <div class="panel" v-show="selection === 0">
                <div class="spanrow header">Players</div>
                <div class="row smallrow" v-for="player in $store.state.game.players" :key="player.id">
                    <div>{{ player.name }}</div>
                    <div>
                        <div @click="kickPlayer(player.id)">Kick</div>
                    </div>
                </div>
                <div class="row smallrow" v-if="Object.values($store.state.game.players).length === 0">
                    <div class="spanrow">There are no players yet, invite some using the link below!</div>
                </div>
                <div class="spanrow header">Invite&nbsp;code</div>
                <div class="row">
                    <div>Invitation URL:</div>
                    <template v-if="showRefreshState">
                        <InputCopyElement :value="refreshState" />
                    </template>
                    <template v-else>
                        <InputCopyElement :value="invitationUrl" />
                    </template>
                </div>
                <div class="row" @click="refreshInviteCode">
                    <div></div>
                    <div>
                        <button>Refresh invitation code</button>
                    </div>
                </div>
                <div class="spanrow header">Danger&nbsp;Zone</div>
                <div class="row">
                    <div>
                        <template v-if="locked">
                            Unlock
                        </template>
                        <template v-else>
                            Lock
                        </template>
                        Session&nbsp;
                        <i>(DM access only)</i>
                    </div>
                    <div>
                        <button class="danger" @click="toggleSessionLock">
                            <template v-if="locked">
                                Unlock
                            </template>
                            <template v-else>
                                Lock
                            </template>
                            this Session
                        </button>
                    </div>
                </div>
                <div class="row">
                    <div>Remove Session</div>
                    <div>
                        <button class="danger" @click="deleteSession">Delete this Session</button>
                    </div>
                </div>
            </div>
            <div class="panel" v-show="selection === 1">
                <div class="row">
                    <label for="useGridInput">Use grid</label>
                    <div>
                        <input id="useGridInput" type="checkbox" v-model="useGrid" />
                    </div>
                </div>
                <div class="row">
                    <label for="gridSizeInput">Grid Size (in pixels):</label>
                    <div>
                        <input id="gridSizeInput" type="number" min="0" v-model.number="gridSize" />
                    </div>
                </div>
                <div class="row">
                    <div>
                        <label for="unitSizeUnit">Size Unit</label>
                    </div>
                    <div>
                        <input id="unitSizeUnit" type="text" v-model="unitSizeUnit" />
                    </div>
                </div>
                <div class="row">
                    <div>
                        <label for="unitSizeInput">Unit Size (in {{ unitSizeUnit }})</label>
                    </div>
                    <div>
                        <input id="unitSizeInput" type="number" v-model.number="unitSize" />
                    </div>
                </div>
            </div>
            <div class="panel" v-show="selection === 2">
                <div class="spanrow header">Core</div>
                <div class="row">
                    <label for="fakePlayerInput">Fake player:</label>
                    <div>
                        <input id="fakePlayerInput" type="checkbox" v-model="fakePlayer" />
                    </div>
                </div>
                <div class="row">
                    <label for="useFOWInput">Fill entire canvas with FOW:</label>
                    <div>
                        <input id="useFOWInput" type="checkbox" v-model="fullFOW" />
                    </div>
                </div>
                <div class="row">
                    <label for="fowLOS">Only show lights in LoS:</label>
                    <div>
                        <input id="fowLOS" type="checkbox" v-model="fowLOS" />
                    </div>
                </div>
                <div class="row">
                    <label for="fowOpacity">FOW opacity:</label>
                    <div>
                        <input id="fowOpacity" type="number" min="0" max="1" step="0.1" v-model.number="fowOpacity" />
                    </div>
                </div>
                <div class="spanrow header">Advanced</div>
                <div class="row">
                    <label for="visionMode">Vision Mode:</label>
                    <div>
                        <select id="visionMode" @change="changeVisionMode">
                            <option :selected="$store.state.visibility.visionMode === 'bvh'">BVH</option>
                            <option :selected="$store.state.visibility.visionMode === 'triangle'">Triangle</option>
                        </select>
                    </div>
                </div>
                <div class="row">
                    <label for="vmininp">Minimal full vision ({{ unitSizeUnit }}):</label>
                    <div>
                        <input id="vmininp" type="number" min="0" v-model.lazy.number="visionRangeMin" />
                    </div>
                </div>
                <div class="row">
                    <label for="vmaxinp">Maximal vision ({{ unitSizeUnit }}):</label>
                    <div>
                        <input id="vmaxinp" type="number" min="0" v-model.lazy.number="visionRangeMax" />
                    </div>
                </div>
            </div>
        </div>
    </Modal>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import { mapState } from "vuex";

import InputCopyElement from "@/core/components/inputCopy.vue";
import Modal from "@/core/components/modals/modal.vue";

import { socket } from "@/game/api/socket";
import { EventBus } from "@/game/event-bus";
import { gameStore } from "@/game/store";
import { layerManager } from "../layers/manager";
import Game from "../game.vue";
import { visibilityStore } from "../visibility/store";

@Component({
    components: {
        InputCopyElement,
        Modal,
    },
    computed: {
        ...mapState("game", ["invitationCode"]),
    },
})
export default class DmSettings extends Vue {
    visible = false;
    categories = ["Admin", "Grid", "Vision"];
    selection = 0;

    showRefreshState = false;
    refreshState = "pending";

    mounted() {
        EventBus.$on("DmSettings.Open", () => {
            this.visible = true;
        });
        EventBus.$on("DmSettings.RefreshedInviteCode", () => {
            this.showRefreshState = false;
        });
    }

    beforeDestroy() {
        EventBus.$off("DmSettings.Open");
        EventBus.$off("DmSettings.RefreshedInviteCode");
    }

    // Admin
    get invitationUrl(): string {
        return window.location.protocol + "//" + window.location.host + "/invite/" + gameStore.invitationCode;
    }
    get locked(): boolean {
        return gameStore.isLocked;
    }
    // Grid
    get useGrid(): boolean {
        return gameStore.useGrid;
    }
    set useGrid(value: boolean) {
        gameStore.setUseGrid({ useGrid: value, sync: true });
    }
    get unitSize(): number {
        return gameStore.unitSize;
    }
    set unitSize(value: number) {
        if (typeof value !== "number") return;
        gameStore.setUnitSize({ unitSize: value, sync: true });
    }
    get unitSizeUnit(): string {
        return gameStore.unitSizeUnit;
    }
    set unitSizeUnit(value: string) {
        gameStore.setUnitSizeUnit({ unitSizeUnit: value, sync: true });
    }
    get gridSize(): number {
        return gameStore.gridSize;
    }
    set gridSize(value: number) {
        if (typeof value !== "number") return;
        gameStore.setGridSize({ gridSize: value, sync: true });
    }
    // Vision
    get fakePlayer(): boolean {
        return gameStore.FAKE_PLAYER;
    }
    set fakePlayer(value: boolean) {
        gameStore.setFakePlayer(value);
    }
    get fullFOW(): boolean {
        return gameStore.fullFOW;
    }
    set fullFOW(value: boolean) {
        gameStore.setFullFOW({ fullFOW: value, sync: true });
    }
    get fowOpacity(): number {
        return gameStore.fowOpacity;
    }
    set fowOpacity(value: number) {
        if (typeof value !== "number") return;
        gameStore.setFOWOpacity({ fowOpacity: value, sync: true });
    }
    get fowLOS(): boolean {
        return gameStore.fowLOS;
    }
    set fowLOS(value: boolean) {
        gameStore.setLineOfSight({ fowLOS: value, sync: true });
    }
    get visionRangeMin(): number {
        return gameStore.visionRangeMin;
    }
    set visionRangeMin(value: number) {
        if (typeof value !== "number") return;
        gameStore.setVisionRangeMin({ value, sync: true });
    }
    get visionRangeMax(): number {
        return gameStore.visionRangeMax;
    }
    set visionRangeMax(value: number) {
        if (typeof value !== "number") return;
        gameStore.setVisionRangeMax({ value, sync: true });
    }
    onClose() {
        this.visible = false;
        EventBus.$emit("DmSettings.Close");
    }
    changeVisionMode(event: { target: HTMLSelectElement }) {
        const value = event.target.value.toLowerCase();
        if (value !== "bvh" && value !== "triangle") return;
        visibilityStore.setVisionMode({ mode: value, sync: true });
        visibilityStore.recalculateVision();
        visibilityStore.recalculateMovement();
        layerManager.invalidate();
    }
    handleClick(event: { target: HTMLElement }) {
        const child = event.target.firstElementChild;
        if (child instanceof HTMLInputElement) {
            child.click();
        }
    }
    refreshInviteCode() {
        socket.emit("Room.Info.InviteCode.Refresh");
        this.refreshState = "pending";
        this.showRefreshState = true;
    }
    kickPlayer(id: number) {
        socket.emit("Room.Info.Players.Kick", id);
        gameStore.kickPlayer(id);
    }
    toggleSessionLock() {
        gameStore.setIsLocked({ isLocked: !gameStore.isLocked, sync: true });
    }
    deleteSession() {
        (<Game>this.$parent).$refs.prompt
            .prompt(
                `ENTER ${gameStore.roomCreator}/${gameStore.roomName} TO CONFIRM SESSION REMOVAL.`,
                `DELETING SESSION`,
            )
            .then(
                (value: string) => {
                    if (value !== `${gameStore.roomCreator}/${gameStore.roomName}`) return;
                    socket.emit("Room.Delete");
                    this.$router.push("/");
                },
                () => {},
            );
    }
}
</script>

<style scoped>
.modal-header {
    background-color: #ff7052;
    padding: 10px;
    font-size: 20px;
    font-weight: bold;
    cursor: move;
}

.header-close {
    position: absolute;
    top: 5px;
    right: 5px;
}

.modal-body {
    display: flex;
    flex-direction: row;
}

* {
    box-sizing: border-box;
}

#categories {
    width: 7.5em;
    background-color: rgba(0, 0, 0, 0);
    border-right: solid 1px #82c8a0;
}

.category {
    border-bottom: solid 1px #82c8a0;
    padding: 5px;
    text-align: right;
    background-color: white;
    padding-right: 10px;
}

.selected,
.category:hover {
    background-color: #82c8a0;
    font-weight: bold;
    cursor: pointer;
    padding-right: 5px;
}

.panel {
    background-color: white;
    padding-left: 1em;
    padding-right: 1em;
    display: grid;
    grid-template-columns: [setting] 1fr [value] 1fr [end];
    /* align-items: center; */
    align-content: start;
    min-height: 10em;
}

.row {
    display: contents;
}

.row > *,
.panel > *:not(.row) {
    display: flex;
    /* justify-content: center; */
    align-items: center;
    padding: 0.5em;
}

.row:first-of-type > * {
    margin-top: 0.5em;
}

.row:last-of-type > * {
    margin-bottom: 0.5em;
}

.row:hover > * {
    cursor: pointer;
    text-shadow: 0px 0px 1px black;
}

.smallrow > * {
    padding: 0.2em;
}

.header {
    line-height: 0.1em;
    margin: 20px 0 15px;
    font-style: italic;
}
.header:after {
    position: relative;
    left: 5px;
    width: 100%;
    border-bottom: 1px solid #000;
    content: "";
}

.spanrow {
    grid-column: 1 / end;
}

.danger {
    color: #ff7052;
}

.danger:hover {
    text-shadow: 0px 0px 1px #ff7052;
    cursor: pointer;
}

input[type="checkbox"] {
    width: 16px;
    height: 23px;
    margin: 0;
    white-space: nowrap;
    display: inline-block;
}

input[type="number"],
input[type="text"] {
    width: 100%;
}
button {
    padding: 6px 12px;
    border: 1px solid lightgray;
    border-radius: 0.25em;
    background-color: rgb(235, 235, 228);
}
</style>

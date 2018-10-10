<template>
    <modal :visible="visible" @close="visible = false" :mask="false">
        <div
            class='modal-header'
            slot='header'
            slot-scope='m'
            draggable="true"
            @dragstart="m.dragStart"
            @dragend="m.dragEnd"
        >
            <div>Initiative</div>
            <div class='header-close' @click="visible = false"><i class="far fa-window-close"></i></div>
        </div>
        <div class='modal-body'>
            <draggable
                id='initiative-list'
                v-model="data"
                @change="updateOrder"
                :options="{setData: () => {}}"
            >
                <template v-for="actor in sortedData">
                    <div :key="actor.uuid" style='display:flex;flex-direction:column;align-items:flex-end;'>
                        <div
                            class='initiative-actor'
                            :class="{'initiative-selected': currentActor === actor.uuid}"
                            @mouseenter="toggleHighlight(actor, true)"
                            @mouseleave="toggleHighlight(actor, false)"
                        >
                            <template v-if="actor.has_img">
                                <img :src="actor.src" width="30px" height="30px">
                            </template>
                            <template v-else>
                                <span style='width: auto;'>{{ actor.src }}</span>
                            </template>
                            <input
                                type="text"
                                placeholder="value"
                                v-model.lazy.number="actor.initiative"
                                :disabled="!owns(actor)"
                                :class="{'notAllowed': !owns(actor)}"
                                @change="syncInitiative(actor)"
                            >
                            <div
                                class='initiative-effects-icon'
                                style='opacity: 0.6'
                                :class="{'notAllowed': !owns(actor)}"
                                @click="createEffect(actor, getDefaultEffect(), true)"
                            >
                                <i class="fas fa-stopwatch"></i>
                                <template v-if='actor.effects'>
                                    {{actor.effects.length}}
                                </template>
                                <template v-else>
                                    0
                                </template>
                            </div>
                            <div
                                :style="{'opacity': actor.visible ? '1.0' : '0.3'}"
                                :class="{'notAllowed': !owns(actor)}"
                                @click="toggleOption(actor, 'visible')"
                            >
                                <i class="fas fa-eye"></i>
                            </div>
                            <div
                                :style="{'opacity': actor.group ? '1.0' : '0.3'}"
                                :class="{'notAllowed': !owns(actor)}"
                                @click="toggleOption(actor, 'group')"
                            >
                                <i class="fas fa-users"></i>
                            </div>
                            <div
                                :style="{'opacity': owns(actor) ? '1.0' : '0.3'}"
                                :class="{'notAllowed': !owns(actor)}"
                                @click="removeInitiative(actor.uuid, true, true)"
                            >
                                <i class="fas fa-trash-alt"></i>
                            </div>
                        </div>
                        <div
                            class='initiative-effect'
                            v-if="actor.effects"
                        >
                            <div
                                v-for="effect in actor.effects"
                                :key='effect.uuid'
                            >
                                <input
                                    type='text'
                                    v-model="effect.name"
                                    :size="effect.name.length || 1"
                                    @change="updateEffect(actor.uuid, effect, true)"
                                >
                                <input
                                    type='text'
                                    v-model="effect.turns"
                                    :size="effect.turns.toString().length || 1"
                                    @change="updateEffect(actor.uuid, effect, true)"
                                >
                            </div>
                        </div>
                    </div>
                </template>
            </draggable>
            <div id='initiative-bar'>
                <div id='initiative-round'>
                    Round {{ roundCounter }}
                </div>
                <div style='display:flex;'></div>
                <div
                    class='initiative-bar-button'
                    :class="{'notAllowed': !$store.state.IS_DM}"
                    @click="setRound(0, true); setTurn(data[0].uuid, true)"
                >
                    <i class="fas fa-sync-alt"></i>
                </div>
                <div
                    class='initiative-bar-button'
                    :class="{'notAllowed': !$store.state.IS_DM}"
                    @click="nextTurn"
                >
                    <i class="fas fa-chevron-right"></i>
                    </div>
            </div>
        </div>
    </modal>
</template>

<script lang="ts">
import Vue from "vue";
import draggable from "vuedraggable";

import { mapState } from "vuex";

import modal from "../../core/components/modals/modal.vue";
import gameManager from "../manager";

import { uuidv4 } from "../../core/utils";
import { InitiativeData, InitiativeEffect } from "../api_types";
import { socket } from "../socket";

export default Vue.component("initiative-dialog", {
    data: () => ({
        visible: false,
        data: <InitiativeData[]>[],
        currentActor: <string | null>null,
        roundCounter: 0,
    }),
    components: {
        modal,
        draggable,
    },
    computed: {
        sortedData(): InitiativeData[] {
            return this.data.sort((a, b) => {
                if (a.initiative === undefined) return 1;
                if (b.initiative === undefined) return -1;
                return b.initiative - a.initiative;
            });
        },
    },
    methods: {
        getActor(actorId: string) {
            return this.data.find(a => a.uuid === actorId);
        },
        updateOrder() {
            socket.emit("Initiative.Set", this.data);
        },
        clear() {
            this.data = [];
            this.currentActor = null;
        },
        contains(uuid: string) {
            return this.data.some(d => d.uuid === uuid);
        },
        owns(actor: InitiativeData): boolean {
            if (this.$store.state.IS_DM) return true;
            const shape = gameManager.layerManager.UUIDMap.get(actor.uuid);
            // Shapes that are unknown to this client are hidden from this client but owned by other clients
            if (shape === undefined) return false;
            return shape.owners.includes(this.$store.state.username);
        },
        setTurn(actorId: string | null, sync: boolean) {
            if (!this.$store.state.IS_DM && sync) return;
            this.currentActor = actorId;
            const actor = this.data.find(a => a.uuid === actorId);
            if (actor === undefined) return;
            if (actor.effects) {
                for (let e = actor.effects.length - 1; e >= 0; e--) {
                    if (actor.effects[e].turns <= 0) actor.effects.splice(e, 1);
                    else actor.effects[e].turns--;
                }
            }
            if (sync) socket.emit("Initiative.Update.Turn", actorId);
        },
        setRound(round: number, sync: boolean) {
            if (!this.$store.state.IS_DM && sync) return;
            this.roundCounter = round;
            if (sync) socket.emit("Initiative.Update.Round", round);
        },
        nextTurn() {
            if (!this.$store.state.IS_DM) return;
            const order = this.sortedData;
            const next = order[(order.findIndex(a => a.uuid === this.currentActor) + 1) % order.length];
            if (this.data[0].uuid === next.uuid) this.setRound(this.roundCounter + 1, true);
            this.setTurn(next.uuid, true);
        },
        updateInitiative(data: InitiativeData, sync: boolean) {
            // If no initiative given, assume it 0
            if (data.initiative === undefined) data.initiative = 0;
            // Check if the shape is already being tracked
            const existing = this.data.find(d => d.uuid === data.uuid);
            if (existing !== undefined) {
                Object.assign(existing, data);
            } else {
                this.data.push(data);
            }
            if (sync) this.syncInitiative(data);
        },
        syncInitiative(data: InitiativeData | { uuid: string }) {
            socket.emit("Initiative.Update", data);
        },
        removeInitiative(uuid: string, sync: boolean, skipGroupCheck: boolean) {
            const d = this.data.findIndex(a => a.uuid === uuid);
            if (d < 0) return;
            if (!skipGroupCheck && this.data[d].group) return;
            if (sync) this.syncInitiative({ uuid });
            this.data.splice(d, 1);

            if (this.currentActor === uuid) {
                if (this.data.length > 1) this.nextTurn();
                else this.currentActor = null;
            }

            const shape = gameManager.layerManager.UUIDMap.get(uuid);
            if (shape === undefined) return;
            if (shape.showHighlight) {
                shape.showHighlight = false;
                gameManager.layerManager.getLayer(shape.layer)!.invalidate(true);
            }
        },
        toggleHighlight(actor: InitiativeData, show: boolean) {
            const shape = gameManager.layerManager.UUIDMap.get(actor.uuid);
            if (shape === undefined) return;
            shape.showHighlight = show;
            gameManager.layerManager.getLayer(shape.layer)!.invalidate(true);
        },
        toggleOption(actor: InitiativeData, option: "visible" | "group") {
            if (!this.owns(actor)) return;
            actor[option] = !actor[option];
            this.syncInitiative(actor);
        },
        createEffect(actor: InitiativeData, effect: InitiativeEffect, sync: boolean) {
            if (!this.owns(actor)) return;
            actor.effects.push(effect);
            if (sync) socket.emit("Initiative.Effect.New", { actor: actor.uuid, effect });
        },
        getDefaultEffect() {
            return { uuid: uuidv4(), name: "New Effect", turns: 10 };
        },
        syncEffect(actor: InitiativeData, effect: InitiativeEffect) {
            if (!this.owns(actor)) return;
            socket.emit("Initiative.Effect.Update", { actor: actor.uuid, effect });
        },
        updateEffect(actorId: string, effect: InitiativeEffect, sync: boolean) {
            const actor = this.data.find(a => a.uuid === actorId);
            if (actor === undefined) return;
            const effectIndex = actor.effects.findIndex(e => e.uuid === effect.uuid);
            if (effectIndex === undefined) return;
            actor.effects[effectIndex] = effect;
            if (sync) this.syncEffect(actor, effect);
            else this.$forceUpdate();
        },
    },
});
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
    padding: 10px;
}

#initiative-list {
    padding: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.initiative-actor {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    padding: 2px 5px;
    margin-bottom: 2px;
    border-radius: 5px;
    border: solid 2px rgba(0, 0, 0, 0);
}

.initiative-selected {
    border: solid 2px #82c8a0;
    background-color: #82c8a0;
}

.initiative-selected + .initiative-effect,
.initiative-actor:hover + .initiative-effect,
.initiative-effect:hover {
    display: flex;
    border-color: rgba(130, 200, 160, 0.6);
    background-color: rgba(130, 200, 160, 0.6);
}

.initiative-actor:hover {
    border: solid 2px #82c8a0;
    cursor: move;
}

.initiative-actor > * {
    width: 30px;
    margin-left: 2px;
}

.initiative-effect {
    display: none;
    flex-direction: column;
    width: -moz-fit-content;
    width: fit-content;
    margin-right: 5px;
    margin-top: -2px;
    margin-bottom: 5px;
    padding: 2px;
    border: solid 2px rgba(0, 0, 0, 0);
    border-bottom-left-radius: 5px;
    border-bottom-right-radius: 5px;
    border-top: none;
}

.initiative-effect > * {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
}

.initiative-effect > * > * {
    border: none;
    background-color: inherit;
    text-align: right;
    margin-left: 20px;
    min-width: 10px;
}
.initiative-effect > * > *:first-child {
    margin-left: 0;
}

#initiative-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-right: 10px;
    margin-left: 10px;
    margin-top: 10px;
    margin-bottom: -10px;
    padding: 2px;
}

.initiative-bar-button {
    border: solid 2px #82c8a0;
    border-radius: 5px;
    padding: 5px;
}

.initiative-bar-button:hover {
    color: white;
    background-color: #82c8a0;
    cursor: pointer;
}
</style>
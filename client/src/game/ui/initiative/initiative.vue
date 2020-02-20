<template>
    <modal :visible="visible" @close="visible = false" :mask="false">
        <div
            class="modal-header"
            slot="header"
            slot-scope="m"
            draggable="true"
            @dragstart="m.dragStart"
            @dragend="m.dragEnd"
        >
            <div>Initiative</div>
            <div class="header-close" @click="visible = false">
                <i class="far fa-window-close"></i>
            </div>
        </div>
        <div class="modal-body">
            <draggable
                id="initiative-list"
                v-model="$store.state.initiative.data"
                @change="updateOrder"
                :setData="fakeSetData"
                :disabled="!$store.state.game.IS_DM"
            >
                <template v-for="actor in $store.state.initiative.data">
                    <div :key="actor.uuid" style="display:flex;flex-direction:column;align-items:flex-end;">
                        <div
                            class="initiative-actor"
                            :class="{ 'initiative-selected': $store.state.initiative.currentActor === actor.uuid }"
                            :style="{ cursor: $store.state.game.IS_DM && 'move' }"
                            @mouseenter="toggleHighlight(actor, true)"
                            @mouseleave="toggleHighlight(actor, false)"
                        >
                            <template v-if="actor.has_img">
                                <img :src="actor.source" width="30px" height="30px" />
                            </template>
                            <template v-else>
                                <span style="width: auto;">{{ actor.source }}</span>
                            </template>
                            <input
                                type="text"
                                placeholder="value"
                                v-model.lazy.number="actor.initiative"
                                :disabled="!owns(actor)"
                                :class="{ notAllowed: !owns(actor) }"
                                @change="syncInitiative(actor)"
                            />
                            <div
                                class="initiative-effects-icon"
                                style="opacity: 0.6"
                                :class="{ notAllowed: !owns(actor) }"
                                @click="createEffect(actor, getDefaultEffect(), true)"
                            >
                                <i class="fas fa-stopwatch"></i>
                                <template v-if="actor.effects">
                                    {{ actor.effects.length }}
                                </template>
                                <template v-else>
                                    0
                                </template>
                            </div>
                            <div
                                :style="{ opacity: actor.visible ? '1.0' : '0.3' }"
                                :class="{ notAllowed: !owns(actor) }"
                                @click="toggleOption(actor, 'visible')"
                            >
                                <i class="fas fa-eye"></i>
                            </div>
                            <div
                                :style="{ opacity: actor.group ? '1.0' : '0.3' }"
                                :class="{ notAllowed: !owns(actor) }"
                                @click="toggleOption(actor, 'group')"
                            >
                                <i class="fas fa-users"></i>
                            </div>
                            <div
                                :style="{ opacity: owns(actor) ? '1.0' : '0.3' }"
                                :class="{ notAllowed: !owns(actor) }"
                                @click="removeInitiative(actor.uuid, true, true)"
                            >
                                <i class="fas fa-trash-alt"></i>
                            </div>
                        </div>
                        <div class="initiative-effect" v-if="actor.effects">
                            <div v-for="effect in actor.effects" :key="effect.uuid">
                                <input
                                    type="text"
                                    v-model="effect.name"
                                    :size="effect.name.length || 1"
                                    @change="updateEffect(actor.uuid, effect, true)"
                                />
                                <input
                                    type="text"
                                    v-model="effect.turns"
                                    :size="effect.turns.toString().length || 1"
                                    @change="updateEffect(actor.uuid, effect, true)"
                                />
                            </div>
                        </div>
                    </div>
                </template>
            </draggable>
            <div id="initiative-bar">
                <div id="initiative-round">Round {{ $store.state.initiative.roundCounter }}</div>
                <div style="display:flex;"></div>
                <div
                    class="initiative-bar-button"
                    :style="visionLock ? 'background-color: #82c8a0' : ''"
                    @click="toggleVisionLock"
                >
                    <i class="fas fa-eye"></i>
                </div>
                <div
                    class="initiative-bar-button"
                    :style="cameraLock ? 'background-color: #82c8a0' : ''"
                    @click="cameraLock = !cameraLock"
                >
                    <i class="fas fa-video"></i>
                </div>
                <div
                    class="initiative-bar-button"
                    :class="{ notAllowed: !$store.state.game.IS_DM }"
                    @click="
                        setRound(0, true);
                        updateTurn($store.state.initiative.data[0].uuid, true);
                    "
                >
                    <i class="fas fa-sync-alt"></i>
                </div>
                <div class="initiative-bar-button" :class="{ notAllowed: !$store.state.game.IS_DM }" @click="nextTurn">
                    <i class="fas fa-chevron-right"></i>
                </div>
            </div>
        </div>
    </modal>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import draggable from "vuedraggable";
Vue.component("draggable", draggable);

import Modal from "@/core/components/modals/modal.vue";

import { uuidv4 } from "@/core/utils";
import { socket } from "@/game/api/socket";
import { InitiativeData, InitiativeEffect } from "@/game/comm/types/general";
import { EventBus } from "@/game/event-bus";
import { layerManager } from "@/game/layers/manager";
import { gameStore } from "@/game/store";
import { initiativeStore } from "./store";
import { gameManager } from "../../manager";

@Component({
    components: {
        Modal,
        draggable,
    },
})
export default class Initiative extends Vue {
    visible = false;
    visionLock = false;
    cameraLock = false;
    _activeTokens: string[] = [];

    mounted(): void {
        EventBus.$on("Initiative.Clear", initiativeStore.clear);
        EventBus.$on("Initiative.Remove", (data: string) => this.removeInitiative(data));
        EventBus.$on("Initiative.Show", () => (this.visible = true));
        EventBus.$on("Initiative.ForceUpdate", () => this.$forceUpdate());

        socket.on("Initiative.Set", initiativeStore.setData);
        socket.on("Initiative.Turn.Set", (data: string) => this.setTurn(data));
        socket.on("Initiative.Turn.Update", (data: string) => this.updateTurn(data, false));
        socket.on("Initiative.Round.Update", (data: number) => this.setRound(data, false));
        socket.on("Initiative.Effect.New", (data: { actor: string; effect: InitiativeEffect }) => {
            const actor = this.getActor(data.actor);
            if (actor === undefined) return;
            this.createEffect(actor, data.effect, false);
        });
        socket.on("Initiative.Effect.Update", (data: { actor: string; effect: InitiativeEffect }) =>
            this.updateEffect(data.actor, data.effect, false),
        );
    }

    beforeDestroy(): void {
        EventBus.$off("Initiative.Clear");
        EventBus.$off("Initiative.Remove");
        EventBus.$off("Initiative.Show");
        socket.off("Initiative.Set");
        socket.off("Initiative.Turn.Set");
        socket.off("Initiative.Turn.Update");
        socket.off("Initiative.Round.Update");
        socket.off("Initiative.Effect.New");
        socket.off("Initiative.Effect.Update");
    }

    // Utilities
    getActor(actorId: string): InitiativeData | undefined {
        return initiativeStore.data.find(a => a.uuid === actorId);
    }
    owns(actor: InitiativeData): boolean {
        if (gameStore.IS_DM) return true;
        const shape = layerManager.UUIDMap.get(actor.uuid);
        // Shapes that are unknown to this client are hidden from this client but owned by other clients
        if (shape === undefined) return false;
        return shape.owners.includes(gameStore.username);
    }
    getDefaultEffect(): { uuid: string; name: string; turns: number } {
        return { uuid: uuidv4(), name: "New Effect", turns: 10 };
    }
    fakeSetData(dataTransfer: DataTransfer): void {
        dataTransfer.setData("Hack", "");
    }
    syncInitiative(data: InitiativeData | { uuid: string }): void {
        socket.emit("Initiative.Update", data);
    }
    // Events
    removeInitiative(uuid: string): void {
        const d = initiativeStore.data.findIndex(a => a.uuid === uuid);
        if (d < 0 || initiativeStore.data[d].group) return;
        this.syncInitiative({ uuid });
        // Remove highlight
        const shape = layerManager.UUIDMap.get(uuid);
        if (shape === undefined) return;
        if (shape.showHighlight) {
            shape.showHighlight = false;
            layerManager.getLayer(shape.floor, shape.layer)!.invalidate(true);
        }
    }
    updateOrder(): void {
        if (!gameStore.IS_DM) return;
        socket.emit(
            "Initiative.Set",
            initiativeStore.data.map(d => d.uuid),
        );
    }
    updateTurn(actorId: string | null, sync: boolean): void {
        if (!gameStore.IS_DM && sync) return;
        initiativeStore.setCurrentActor(actorId);
        const actor = initiativeStore.data.find(a => a.uuid === actorId);
        if (actor === undefined) return;
        if (actor.effects) {
            for (let e = actor.effects.length - 1; e >= 0; e--) {
                if (actor.effects[e].turns <= 0) actor.effects.splice(e, 1);
                else actor.effects[e].turns--;
            }
        }
        if (this.visionLock) {
            if (actorId !== null && gameStore.ownedtokens.includes(actorId)) gameStore.setActiveTokens([actorId]);
            else gameStore.setActiveTokens([]);
        }
        if (this.cameraLock) {
            if (actorId !== null) {
                const shape = layerManager.UUIDMap.get(actorId);
                if (shape !== undefined && shape.ownedBy()) {
                    gameManager.setCenterPosition(shape.center());
                }
            }
        }
        if (sync) socket.emit("Initiative.Turn.Update", actorId);
    }
    setRound(round: number, sync: boolean): void {
        if (!gameStore.IS_DM && sync) return;
        initiativeStore.setRoundCounter(round);
        if (sync) socket.emit("Initiative.Round.Update", round);
    }
    setTurn(actorId: string | null): void {
        initiativeStore.setTurn(actorId);
    }
    nextTurn(): void {
        if (!gameStore.IS_DM) return;
        const order = initiativeStore.data;
        const next = order[(order.findIndex(a => a.uuid === initiativeStore.currentActor) + 1) % order.length];
        if (initiativeStore.data[0].uuid === next.uuid) this.setRound(initiativeStore.roundCounter + 1, true);
        this.updateTurn(next.uuid, true);
    }
    toggleHighlight(actor: InitiativeData, show: boolean): void {
        const shape = layerManager.UUIDMap.get(actor.uuid);
        if (shape === undefined) return;
        shape.showHighlight = show;
        layerManager.getLayer(shape.floor, shape.layer)!.invalidate(true);
    }
    toggleOption(actor: InitiativeData, option: "visible" | "group"): void {
        if (!this.owns(actor)) return;
        actor[option] = !actor[option];
        this.syncInitiative(actor);
    }
    createEffect(actor: InitiativeData, effect: InitiativeEffect, sync: boolean): void {
        if (!this.owns(actor)) return;
        actor.effects.push(effect);
        if (sync) socket.emit("Initiative.Effect.New", { actor: actor.uuid, effect });
    }
    syncEffect(actor: InitiativeData, effect: InitiativeEffect): void {
        if (!this.owns(actor)) return;
        socket.emit("Initiative.Effect.Update", { actor: actor.uuid, effect });
    }
    updateEffect(actorId: string, effect: InitiativeEffect, sync: boolean): void {
        const actor = initiativeStore.data.find(a => a.uuid === actorId);
        if (actor === undefined) return;
        const effectIndex = actor.effects.findIndex(e => e.uuid === effect.uuid);
        if (effectIndex === undefined) return;
        actor.effects[effectIndex] = effect;
        if (sync) this.syncEffect(actor, effect);
        else this.$forceUpdate();
    }
    toggleVisionLock(): void {
        this.visionLock = !this.visionLock;
        if (this.visionLock) {
            this._activeTokens = [...gameStore._activeTokens];
            if (initiativeStore.currentActor !== null && gameStore.ownedtokens.includes(initiativeStore.currentActor))
                gameStore.setActiveTokens([initiativeStore.currentActor]);
        } else {
            gameStore.setActiveTokens(this._activeTokens);
        }
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

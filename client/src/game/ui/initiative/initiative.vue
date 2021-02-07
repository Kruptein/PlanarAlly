<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import draggable from "vuedraggable";
Vue.component("draggable", draggable);

import ConfirmDialog from "@/core/components/modals/confirm.vue";
import Modal from "@/core/components/modals/modal.vue";
import { uuidv4 } from "@/core/utils";
import {
    sendInitiativeUpdate,
    sendInitiativeRemove,
    sendInitiativeSet,
    sendInitiativeTurnUpdate,
    sendInitiativeRoundUpdate,
    sendInitiativeNewEffect,
    sendInitiativeUpdateEffect,
    sendInitiativeRemoveEffect,
} from "@/game/api/emits/initiative";
import { socket } from "@/game/api/socket";
import { InitiativeData, InitiativeEffect } from "@/game/comm/types/general";
import { EventBus } from "@/game/event-bus";
import { layerManager } from "@/game/layers/manager";
import { gameStore } from "@/game/store";

import { getGroupMembers } from "../../groups";
import { gameManager } from "../../manager";
import { Shape } from "../../shapes/shape";

import { initiativeStore } from "./store";

@Component({
    components: {
        ConfirmDialog,
        Modal,
        draggable,
    },
})
export default class Initiative extends Vue {
    $refs!: {
        confirmDialog: ConfirmDialog;
    };

    visible = false;
    visionLock = false;
    cameraLock = false;
    _activeTokens: string[] = [];

    mounted(): void {
        EventBus.$on("Initiative.Clear", initiativeStore.clear);
        EventBus.$on("Initiative.Remove", (data: string) => this.removeInitiative(data, false));
        EventBus.$on("Initiative.Show", () => (this.visible = true));
        EventBus.$on("Initiative.ForceUpdate", () => this.$forceUpdate());

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
        socket.on("Initiative.Effect.Remove", (data: { actor: string; effect: InitiativeEffect }) =>
            this.removeEffect(data.actor, data.effect, false),
        );
    }

    beforeDestroy(): void {
        EventBus.$off("Initiative.Clear");
        EventBus.$off("Initiative.Remove");
        EventBus.$off("Initiative.Show");
        socket.off("Initiative.Turn.Set");
        socket.off("Initiative.Turn.Update");
        socket.off("Initiative.Round.Update");
        socket.off("Initiative.Effect.New");
        socket.off("Initiative.Effect.Update");
        socket.off("Initiative.Effect.Remove");
    }

    // Utilities
    getActor(actorId: string): InitiativeData | undefined {
        return initiativeStore.data.find((a) => a.uuid === actorId);
    }
    owns(actor: InitiativeData): boolean {
        if (gameStore.IS_DM) return true;
        const shape = layerManager.UUIDMap.get(actor.uuid);
        // Shapes that are unknown to this client are hidden from this client but owned by other clients
        if (shape === undefined) return false;
        return shape.ownedBy(false, { editAccess: true });
    }
    getDefaultEffect(): { uuid: string; name: string; turns: number } {
        return { uuid: uuidv4(), name: this.$t("game.ui.initiative.initiative.new_effect").toString(), turns: 10 };
    }
    fakeSetData(dataTransfer: DataTransfer): void {
        dataTransfer.setData("Hack", "");
    }
    syncInitiative(data: InitiativeData): void {
        sendInitiativeUpdate(data);
    }
    // Events
    async removeInitiative(uuid: string, sync: boolean): Promise<void> {
        const d = initiativeStore.data.findIndex((a) => a.uuid === uuid);
        if (d < 0) return;
        if (initiativeStore.data[d].group) {
            const continueRemoval = await this.$refs.confirmDialog.open(
                "Removing initiative",
                "Are you sure you wish to remove this group from the initiative order?",
            );
            if (!continueRemoval) {
                return;
            }
        }
        initiativeStore.data.splice(d, 1);
        if (sync) sendInitiativeRemove(uuid);
        // Remove highlight
        const shape = layerManager.UUIDMap.get(uuid);
        if (shape === undefined) return;
        if (shape.showHighlight) {
            shape.showHighlight = false;
            shape.layer.invalidate(true);
        }
    }
    updateOrder(): void {
        if (!gameStore.IS_DM) return;
        sendInitiativeSet(initiativeStore.data.map((d) => d.uuid));
    }
    updateTurn(actorId: string, sync: boolean): void {
        if (!gameStore.IS_DM && sync) return;
        initiativeStore.setCurrentActor(actorId);
        const actor = initiativeStore.data.find((a) => a.uuid === actorId);
        if (actor === undefined) return;
        if (actor.effects) {
            for (let e = actor.effects.length - 1; e >= 0; e--) {
                if (!isNaN(+actor.effects[e].turns)) {
                    if (actor.effects[e].turns <= 0) actor.effects.splice(e, 1);
                    else actor.effects[e].turns--;
                }
            }
        }
        if (this.visionLock) {
            if (actorId !== null && gameStore.ownedtokens.includes(actorId)) gameStore.setActiveTokens([actorId]);
            else gameStore.setActiveTokens(undefined);
        }
        if (this.cameraLock) {
            if (actorId !== null) {
                const shape = layerManager.UUIDMap.get(actorId);
                if (shape?.ownedBy(false, { visionAccess: true })) {
                    gameManager.setCenterPosition(shape.center());
                }
            }
        }
        if (sync) sendInitiativeTurnUpdate(actorId);
    }
    setRound(round: number, sync: boolean): void {
        if (!gameStore.IS_DM && sync) return;
        initiativeStore.setRoundCounter(round);
        if (sync) sendInitiativeRoundUpdate(round);
    }
    setTurn(actorId: string | null): void {
        initiativeStore.setTurn(actorId);
    }
    nextTurn(): void {
        if (!gameStore.IS_DM) return;
        const order = initiativeStore.data;
        const next = order[(order.findIndex((a) => a.uuid === initiativeStore.currentActor) + 1) % order.length];
        if (initiativeStore.data[0].uuid === next.uuid) this.setRound(initiativeStore.roundCounter + 1, true);
        this.updateTurn(next.uuid, true);
    }
    toggleHighlight(actor: InitiativeData, show: boolean): void {
        const shape = layerManager.UUIDMap.get(actor.uuid);
        if (shape === undefined) return;
        let shapeArray: Shape[];
        if (shape.groupId === undefined) {
            shapeArray = [shape];
        } else {
            shapeArray = getGroupMembers(shape.groupId);
        }
        for (const sh of shapeArray) {
            sh.showHighlight = show;
            sh.layer.invalidate(true);
        }
    }
    toggleOption(actor: InitiativeData, option: "visible" | "group"): void {
        if (!this.owns(actor)) return;
        actor[option] = !actor[option];
        this.syncInitiative(actor);
    }
    createEffect(actor: InitiativeData, effect: InitiativeEffect, sync: boolean): void {
        actor.effects.push(effect);
        if (sync) sendInitiativeNewEffect({ actor: actor.uuid, effect });
    }
    syncEffect(actor: InitiativeData, effect: InitiativeEffect): void {
        if (!this.owns(actor)) return;
        sendInitiativeUpdateEffect({ actor: actor.uuid, effect });
    }
    updateEffect(actorId: string, effect: InitiativeEffect, sync: boolean): void {
        const actor = initiativeStore.data.find((a) => a.uuid === actorId);
        if (actor === undefined) return;
        const effectIndex = actor.effects.findIndex((e) => e.uuid === effect.uuid);
        if (effectIndex === undefined) return;
        actor.effects[effectIndex] = effect;
        if (sync) this.syncEffect(actor, effect);
        else this.$forceUpdate();
    }
    removeEffect(actorId: string, effect: InitiativeEffect, sync: boolean): void {
        const actor = initiativeStore.data.find((a) => a.uuid === actorId);
        if (actor === undefined) return;
        const effectIndex = actor.effects.findIndex((e) => e.uuid === effect.uuid);
        if (effectIndex === undefined) return;
        actor.effects.splice(effectIndex, 1);
        if (sync) sendInitiativeRemoveEffect({ actor: actorId, effect });
        else this.$forceUpdate();
    }
    toggleVisionLock(): void {
        this.visionLock = !this.visionLock;
        if (this.visionLock) {
            this._activeTokens = [...gameStore.activeTokens];
            if (initiativeStore.currentActor && gameStore.ownedtokens.includes(initiativeStore.currentActor))
                gameStore.setActiveTokens([initiativeStore.currentActor]);
        } else {
            gameStore.setActiveTokens(this._activeTokens);
        }
    }
    setLock(lock: boolean): void {
        initiativeStore.setLock(lock);
    }
    getName(actor: InitiativeData): string {
        const shape = layerManager.UUIDMap.get(actor.uuid);
        if (shape !== undefined) {
            if (shape.nameVisible) return shape.name;
            if (shape.ownedBy(false, { editAccess: true })) return shape.name;
        }
        return actor.source;
    }
}
</script>

<template>
    <modal :visible="visible" @close="visible = false" :mask="false">
        <ConfirmDialog ref="confirmDialog"></ConfirmDialog>
        <div
            class="modal-header"
            slot="header"
            slot-scope="m"
            draggable="true"
            @dragstart="m.dragStart"
            @dragend="m.dragEnd"
        >
            <div v-t="'common.initiative'"></div>
            <div class="header-close" @click="visible = false" :title="$t('common.close')">
                <font-awesome-icon :icon="['far', 'window-close']" />
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
                    <div :key="actor.uuid" style="display: flex; flex-direction: column; align-items: flex-end">
                        <div
                            class="initiative-actor"
                            :class="{ 'initiative-selected': $store.state.initiative.currentActor === actor.uuid }"
                            :style="{ cursor: $store.state.game.IS_DM && 'move' }"
                            @mouseenter="toggleHighlight(actor, true)"
                            @mouseleave="toggleHighlight(actor, false)"
                        >
                            <template v-if="actor.has_img">
                                <img :src="actor.source" width="30px" height="30px" :title="getName(actor)" alt="" />
                            </template>
                            <template v-else>
                                <span style="width: auto">{{ getName(actor) }}</span>
                            </template>
                            <input
                                type="text"
                                :placeholder="$t('common.value')"
                                v-model.lazy.number="actor.initiative"
                                :disabled="!owns(actor)"
                                :class="{ notAllowed: !owns(actor) }"
                                @focus="setLock(true)"
                                @blur="setLock(false)"
                                @change="syncInitiative(actor)"
                            />
                            <div
                                class="initiative-effects-icon"
                                style="opacity: 0.6"
                                :class="{ notAllowed: !owns(actor) }"
                                @click="createEffect(actor, getDefaultEffect(), true)"
                                :title="$t('game.ui.initiative.initiative.add_timed_effect')"
                            >
                                <font-awesome-icon icon="stopwatch" />
                                <template v-if="actor.effects">
                                    {{ actor.effects.length }}
                                </template>
                                <template v-else>0</template>
                            </div>
                            <div
                                :style="{ opacity: actor.visible ? '1.0' : '0.3' }"
                                :class="{ notAllowed: !owns(actor) }"
                                @click="toggleOption(actor, 'visible')"
                                :title="$t('common.toggle_public_private')"
                            >
                                <font-awesome-icon icon="eye" />
                            </div>
                            <div
                                :style="{ opacity: actor.group ? '1.0' : '0.3' }"
                                :class="{ notAllowed: !owns(actor) }"
                                @click="toggleOption(actor, 'group')"
                                :title="$t('game.ui.initiative.initiative.toggle_group')"
                            >
                                <font-awesome-icon icon="users" />
                            </div>
                            <div
                                :style="{ opacity: owns(actor) ? '1.0' : '0.3' }"
                                :class="{ notAllowed: !owns(actor) }"
                                @click="removeInitiative(actor.uuid, true)"
                                :title="$t('game.ui.initiative.initiative.delete_init')"
                            >
                                <font-awesome-icon icon="trash-alt" />
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
                                <div
                                    :style="{ opacity: owns(actor) ? '1.0' : '0.3' }"
                                    :class="{ notAllowed: !owns(actor) }"
                                    @click="removeEffect(actor.uuid, effect, true)"
                                    :title="$t('game.ui.initiative.initiative.delete_effect')"
                                >
                                    <font-awesome-icon icon="trash-alt" />
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </draggable>
            <div id="initiative-bar">
                <div id="initiative-round">
                    {{ $tc("game.ui.initiative.initiative.round_N", $store.state.initiative.roundCounter) }}
                </div>
                <div style="display: flex"></div>
                <div
                    class="initiative-bar-button"
                    :style="visionLock ? 'background-color: #82c8a0' : ''"
                    @click="toggleVisionLock"
                    :title="$t('game.ui.initiative.initiative.vision_log_msg')"
                >
                    <font-awesome-icon icon="eye" />
                </div>
                <div
                    class="initiative-bar-button"
                    :style="cameraLock ? 'background-color: #82c8a0' : ''"
                    @click="cameraLock = !cameraLock"
                    :title="$t('game.ui.initiative.initiative.camera_log_msg')"
                >
                    <font-awesome-icon icon="video" />
                </div>
                <div
                    class="initiative-bar-button"
                    :class="{ notAllowed: !$store.state.game.IS_DM }"
                    @click="
                        setRound(1, true);
                        updateTurn($store.state.initiative.data[0].uuid, true);
                    "
                    :title="$t('game.ui.initiative.initiative.reset_round')"
                >
                    <font-awesome-icon icon="sync-alt" />
                </div>
                <div
                    class="initiative-bar-button"
                    :class="{ notAllowed: !$store.state.game.IS_DM }"
                    @click="nextTurn"
                    :title="$t('game.ui.initiative.initiative.next')"
                >
                    <font-awesome-icon icon="chevron-right" />
                </div>
            </div>
        </div>
    </modal>
</template>

<style scoped lang="scss">
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

    &:hover {
        border: solid 2px #82c8a0;
    }

    > * {
        width: 30px;
        margin-left: 2px;
    }
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

    > * {
        display: flex;
        flex-direction: row;
        justify-content: flex-end;

        > * {
            border: none;
            background-color: inherit;
            text-align: right;
            min-width: 10px;

            &:first-child {
                margin-left: 0;
            }
        }
    }
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

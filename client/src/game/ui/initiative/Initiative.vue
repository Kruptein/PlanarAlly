<script setup lang="ts">
import { computed, onMounted, toRef } from "vue";
import { useI18n } from "vue-i18n";
import draggable from "vuedraggable";

import Modal from "../../../core/components/modals/Modal.vue";
import { useModal } from "../../../core/plugins/modals/plugin";
import { getTarget, getValue } from "../../../core/utils";
import { clientStore } from "../../../store/client";
import { gameStore } from "../../../store/game";
import { uiStore } from "../../../store/ui";
import { sendRequestInitiatives } from "../../api/emits/initiative";
import { getGroupMembers } from "../../groups";
import { getShape } from "../../id";
import type { LocalId } from "../../id";
import type { InitiativeData } from "../../models/initiative";
import { InitiativeEffectMode, InitiativeSort } from "../../models/initiative";
import type { IShape } from "../../shapes/interfaces";
import type { Asset } from "../../shapes/variants/asset";
import { accessSystem } from "../../systems/access";
import { ClientSettingCategory } from "../settings/client/categories";

import { initiativeStore } from "./state";

const { t } = useI18n();
const modals = useModal();

const isDm = toRef(gameStore.state, "isDm");

const close = (): void => initiativeStore.show(false);
const clearValues = (): void => initiativeStore.clearValues(true);
const nextTurn = (): void => initiativeStore.nextTurn();
const previousTurn = (): void => initiativeStore.previousTurn();
const owns = (actorId?: LocalId): boolean => initiativeStore.owns(actorId);
const toggleOption = (index: number, option: "isVisible" | "isGroup"): void =>
    initiativeStore.toggleOption(index, option);

onMounted(() => initiativeStore.show(false));

const alwaysShowEffects = computed(() => clientStore.state.initiativeEffectVisibility === InitiativeEffectMode.Always);

function getName(actor: InitiativeData): string {
    const shape = getShape(actor.shape);
    if (shape !== undefined) {
        if (shape.nameVisible) return shape.name;
        if (accessSystem.hasAccessTo(shape.id, false, { edit: true })) return shape.name;
    }
    return "?";
}

async function removeInitiative(actor: InitiativeData): Promise<void> {
    if (actor.isGroup) {
        const continueRemoval = await modals.confirm(
            "Removing initiative",
            "Are you sure you wish to remove this group from the initiative order?",
        );
        if (continueRemoval !== true) {
            return;
        }
    }
    initiativeStore.removeInitiative(actor.shape, true);
}

function setEffectName(shape: LocalId, index: number, name: string): void {
    if (initiativeStore.owns(shape)) initiativeStore.setEffectName(shape, index, name, true);
}

function setEffectTurns(shape: LocalId, index: number, turns: string): void {
    if (initiativeStore.owns(shape)) initiativeStore.setEffectTurns(shape, index, turns, true);
}

function createEffect(shape: LocalId): void {
    if (initiativeStore.owns(shape)) initiativeStore.createEffect(shape, undefined, true);
}

function removeEffect(shape: LocalId, index: number): void {
    if (initiativeStore.owns(shape)) initiativeStore.removeEffect(shape, index, true);
}

function toggleHighlight(actorId: LocalId, show: boolean): void {
    const shape = getShape(actorId);
    if (shape === undefined) return;
    let shapeArray: IShape[];
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

function hasImage(actor: InitiativeData): boolean {
    return getShape(actor.shape)?.type === "assetrect" ?? false;
}

function getImage(actor: InitiativeData): string {
    return (getShape(actor.shape)! as Asset).src;
}

function canSee(actor: InitiativeData): boolean {
    if (isDm.value || actor.isVisible) return true;
    return accessSystem.hasAccessTo(actor.shape, false, { edit: true });
}

function reset(): void {
    initiativeStore.setRoundCounter(1, true);
    sendRequestInitiatives();
}

function lock(shape: LocalId): void {
    if (initiativeStore.owns(shape)) initiativeStore.lock(shape);
}

function unlock(): void {
    if (initiativeStore.state.editLock !== -1) initiativeStore.unlock();
}

function setInitiative(shape: LocalId, value: string): void {
    const numValue = Number.parseInt(value);
    if (isNaN(numValue)) return;

    if (initiativeStore.owns(shape)) initiativeStore.setInitiative(shape, numValue, true);
}

function changeOrder(data: Event & { moved?: { element: InitiativeData; newIndex: number; oldIndex: number } }): void {
    if (isDm.value && data.moved)
        initiativeStore.changeOrder(data.moved.element.shape, data.moved.oldIndex, data.moved.newIndex);
}

function changeSort(): void {
    if (isDm.value) {
        const sort = (initiativeStore.state.sort + 1) % (Object.keys(InitiativeSort).length / 2);
        initiativeStore.changeSort(sort, true);
    }
}

function translateSort(sort: InitiativeSort): string {
    switch (sort) {
        case InitiativeSort.Down:
            return "sort-amount-down";
        case InitiativeSort.Up:
            return "sort-amount-down-alt";
        default:
            return "hand-paper";
    }
}

function openSettings(): void {
    uiStore.setClientTab(ClientSettingCategory.Initiative);
    uiStore.showClientSettings(true);
}

// shitty helper because draggable loses all type information :arghfist:
function n(e: any): number {
    return e;
}
</script>

<template>
    <Modal :visible="initiativeStore.state.showInitiative" @close="close" :mask="false">
        <template v-slot:header="m">
            <div class="modal-header" draggable="true" @dragstart="m.dragStart" @dragend="m.dragEnd">
                <div>{{ t("common.initiative") }}</div>
                <div class="header-close" @click="close" :title="t('common.close')">
                    <font-awesome-icon :icon="['far', 'window-close']" />
                </div>
            </div>
        </template>
        <div class="modal-body">
            <draggable
                id="initiative-list"
                :modelValue="initiativeStore.state.locationData"
                @change="changeOrder"
                :disabled="!isDm"
                item-key="uuid"
            >
                <template #item="{ element: actor, index }">
                    <div style="display: flex; flex-direction: column; align-items: flex-end" v-if="canSee(actor)">
                        <div
                            class="initiative-actor"
                            :class="{
                                'initiative-selected': initiativeStore.state.turnCounter === index,
                                blurred:
                                    initiativeStore.state.editLock !== -1 &&
                                    initiativeStore.state.editLock !== actor.shape,
                            }"
                            :style="{ cursor: isDm ? 'move' : 'auto' }"
                            @mouseenter="toggleHighlight(actor.shape, true)"
                            @mouseleave="toggleHighlight(actor.shape, false)"
                        >
                            <div
                                v-if="owns(actor.shape)"
                                class="remove"
                                @click="removeInitiative(actor)"
                                :class="{ notAllowed: !owns(actor.shape) }"
                            >
                                &#215;
                            </div>
                            <template v-if="hasImage(actor)">
                                <img :src="getImage(actor)" :title="getName(actor)" alt="" />
                            </template>
                            <template v-else>
                                <span style="width: auto">{{ getName(actor) }}</span>
                            </template>
                            <input
                                class="initiative-value"
                                type="text"
                                :placeholder="t('common.value')"
                                :value="actor.initiative"
                                :disabled="!owns(actor.shape)"
                                :class="{ notAllowed: !owns(actor.shape) }"
                                @focus="lock(actor.shape)"
                                @blur="unlock"
                                @change="setInitiative(actor.shape, getValue($event))"
                                @keyup.enter="getTarget($event).blur()"
                            />
                            <div
                                :style="{ opacity: actor.isVisible ? '1.0' : '0.3' }"
                                :class="{ notAllowed: !owns(actor.shape) }"
                                @click="toggleOption(index, 'isVisible')"
                                :title="t('common.toggle_public_private')"
                            >
                                <font-awesome-icon icon="eye" />
                            </div>
                            <div
                                :style="{ opacity: actor.isGroup ? '1.0' : '0.3' }"
                                :class="{ notAllowed: !owns(actor.shape) }"
                                @click="toggleOption(index, 'isGroup')"
                                :title="t('game.ui.initiative.toggle_group')"
                            >
                                <font-awesome-icon icon="users" />
                            </div>
                            <div
                                class="initiative-effects-icon"
                                style="opacity: 0.6"
                                :class="{ notAllowed: !owns(actor.shape) }"
                                @click="createEffect(actor.shape)"
                                :title="t('game.ui.initiative.add_timed_effect')"
                            >
                                <font-awesome-icon icon="stopwatch" />
                                <template v-if="actor.effects">
                                    {{ actor.effects.length }}
                                </template>
                                <template v-else>0</template>
                            </div>
                        </div>
                        <div
                            class="initiative-effect"
                            :class="{ 'effect-visible': alwaysShowEffects }"
                            v-if="actor.effects.length > 0"
                        >
                            <div v-for="(effect, e) of actor.effects" :key="effect.uuid">
                                <input
                                    type="text"
                                    v-model="effect.name"
                                    :style="{ width: '100px' }"
                                    :class="{ notAllowed: !owns(actor.shape) }"
                                    :disabled="!owns(actor.shape)"
                                    @change="setEffectName(actor.shape, n(e), getValue($event))"
                                />
                                <input
                                    type="text"
                                    v-model="effect.turns"
                                    :style="{ width: '25px' }"
                                    :class="{ notAllowed: !owns(actor.shape) }"
                                    :disabled="!owns(actor.shape)"
                                    @change="setEffectTurns(actor.shape, n(e), getValue($event))"
                                />
                                <div
                                    :style="{ opacity: owns(actor.shape) ? '1.0' : '0.3' }"
                                    :class="{ notAllowed: !owns(actor.shape) }"
                                    @click="removeEffect(actor.shape, n(e))"
                                    :title="t('game.ui.initiative.delete_effect')"
                                >
                                    <font-awesome-icon icon="trash-alt" />
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </draggable>
            <div id="initiative-bar-dm" v-if="isDm">
                <div class="initiative-bar-button" @click="reset" :title="t('game.ui.initiative.reset_round')">
                    <font-awesome-icon icon="angle-double-left" />
                </div>
                <div class="initiative-bar-button" @click="previousTurn" :title="t('game.ui.initiative.previous')">
                    <font-awesome-icon icon="chevron-left" />
                </div>
                <div class="initiative-bar-button" @click="clearValues" :title="t('game.ui.initiative.clear')">
                    <font-awesome-icon icon="sync-alt" />
                </div>
                <div class="initiative-bar-button" @click="changeSort" :title="t('game.ui.initiative.change_sort')">
                    <font-awesome-icon
                        :icon="translateSort(initiativeStore.state.sort)"
                        :key="initiativeStore.state.sort"
                    />
                </div>
                <div
                    class="initiative-bar-button"
                    :class="{ notAllowed: !isDm }"
                    @click="nextTurn"
                    :title="t('game.ui.initiative.next')"
                >
                    <font-awesome-icon icon="chevron-right" />
                </div>
            </div>
            <div id="initiative-round">
                {{ t("game.ui.initiative.round_N", initiativeStore.state.roundCounter) }}

                <div
                    id="initiative-settings"
                    class="initiative-bar-button"
                    @click="openSettings"
                    :title="t('game.ui.initiative.settings')"
                >
                    <font-awesome-icon icon="cog" />
                </div>
                <div
                    v-if="!isDm"
                    id="initiative-next-round"
                    class="initiative-bar-button"
                    :class="{ notAllowed: !owns() }"
                    :style="{ opacity: owns() ? 1.0 : 0.3 }"
                    @click="nextTurn"
                    :title="t('game.ui.initiative.next')"
                >
                    <font-awesome-icon icon="chevron-right" />
                </div>
            </div>
        </div>
    </Modal>
</template>

<style scoped lang="scss">
.modal-header {
    background-color: #ff7052;
    padding: 10px;
    font-size: 20px;
    font-weight: bold;
    cursor: move;
    min-width: 150px;
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
    position: relative;

    min-width: 155px;

    .remove {
        display: none;

        position: absolute;
        color: red;
        font-size: 25px;
        font-weight: bold;
        cursor: pointer;
        top: -15px;
        right: -8px;
    }

    &:hover {
        border: solid 2px #82c8a0;

        > .remove {
            display: block;
        }
    }

    img {
        width: 30px;
    }

    svg {
        width: 20px;
        margin: 0 1px;
    }

    > * {
        display: flex;
        justify-content: center;
    }

    .initiative-value {
        font-weight: 800;
        width: 60px;
        margin: 0 10px;
        padding: 2px;
        text-align: center;
        background-color: inherit;
        border: 0;

        cursor: pointer;
    }
}

.blurred {
    filter: blur(5px);
}

.initiative-selected {
    border: solid 2px #82c8a0;
    background-color: #82c8a0;
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

.initiative-selected + .initiative-effect,
.initiative-actor:hover + .initiative-effect,
.initiative-effect:hover,
.effect-visible {
    display: flex;
    border-color: rgba(130, 200, 160, 0.6);
    background-color: rgba(130, 200, 160, 0.6);
}

#initiative-bar-dm {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 10px;
}

#initiative-round {
    text-align: center;
    margin: 10px 0;
    position: relative;

    #initiative-settings {
        position: absolute;
        right: 30px;
        top: -6px;
    }

    #initiative-next-round {
        position: absolute;
        right: 5px;
        top: -6px;
    }
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

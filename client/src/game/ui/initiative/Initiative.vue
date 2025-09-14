<script setup lang="ts">
import type { SortableEvent } from "sortablejs";
import { computed, type DeepReadonly, onMounted, nextTick, ref, useTemplateRef, watch } from "vue";
import { type DraggableEvent, VueDraggable } from "vue-draggable-plus";
import { useI18n } from "vue-i18n";

import Modal from "../../../core/components/modals/Modal.vue";
import RollingCounter from "../../../core/components/RollingCounter.vue";
import { baseAdjust } from "../../../core/http";
import type { GlobalId, LocalId } from "../../../core/id";
import { map } from "../../../core/iter";
import { getTarget, getValue } from "../../../core/utils";
import { sendRequestInitiatives } from "../../api/emits/initiative";
import { getShape } from "../../id";
import type { IShape } from "../../interfaces/shape";
import type { IAsset } from "../../interfaces/shapes/asset";
import { InitiativeTurnDirection, type InitiativeData } from "../../models/initiative";
import { InitiativeEffectMode, InitiativeSort } from "../../models/initiative";
import { accessSystem } from "../../systems/access";
import { gameState } from "../../systems/game/state";
import { groupSystem } from "../../systems/groups";
import { propertiesSystem } from "../../systems/properties";
import { propertiesState } from "../../systems/properties/state";
import { playerSettingsState } from "../../systems/settings/players/state";
import { uiSystem } from "../../systems/ui";
import { ClientSettingCategory } from "../settings/client/categories";

import { initiativeStore } from "./state";

const { t } = useI18n();

const emit = defineEmits(["close"]);

const close = (): void => {
    initiativeStore.show(false, false);
    emit("close");
};
defineExpose({ close });

interface ConfirmationDialog {
    message: string;
    resolve: (confirm: boolean) => void;
}

const confirmationDialog = ref<ConfirmationDialog | null>(null);
const listElement = useTemplateRef("list-element");

const hasVisibleActor = computed(() => initiativeStore.state.locationData.some((actor) => canSee(actor)));

const owns = (actorId?: GlobalId): boolean => initiativeStore.owns(actorId);
const toggleOption = (index: number, option: "isVisible" | "isGroup"): void =>
    initiativeStore.toggleOption(index, option);

onMounted(() => {
    initiativeStore.show(false, false);
    setTimeout(() => {
        scrollToInitiative();
    }, 300);
});

watch(
    () => initiativeStore.state.turnCounter,
    async () => {
        await nextTick();
        scrollToInitiative();
    },
);

watch(
    () => initiativeStore.state.locationData,
    (newList, oldList) => {
        for (const item of oldList ?? []) {
            if (item.localId !== undefined) {
                propertiesSystem.dropState(item.localId, "initiative-ui");
            }
        }
        for (const item of newList) {
            if (item.localId !== undefined) {
                propertiesSystem.loadState(item.localId, "initiative-ui");
            }
        }
    },
    { immediate: true },
);

const alwaysShowEffects = computed(
    () => playerSettingsState.reactive.initiativeEffectVisibility.value === InitiativeEffectMode.Always,
);

async function loadConfirmationDialog(message: string): Promise<boolean> {
    const { promise, resolve } = Promise.withResolvers<boolean>();
    confirmationDialog.value = { message, resolve };
    return promise;
}

function confirmation(confirm: boolean): void {
    if (confirmationDialog.value === null) return;
    confirmationDialog.value.resolve(confirm);
    confirmationDialog.value = null;
}

async function clearInitiativeEntries(): Promise<void> {
    const result = await loadConfirmationDialog(t("game.ui.initiative.clear_entries_msg"));
    if (result) {
        initiativeStore.clearEntries(true);
    }
}

async function clearInitiativeValues(): Promise<void> {
    const result = await loadConfirmationDialog(t("game.ui.initiative.clear_initiatives_msg"));
    if (result) {
        initiativeStore.clearValues(true);
    }
}

function scrollToInitiative(): void {
    if (listElement.value === null) return;

    const childElements = listElement.value.children as HTMLCollection;

    if (childElements.length <= 0) return;

    const entryElement = childElements[0]!.querySelector(".initiative-selected");
    if (!entryElement) return;

    entryElement.parentElement!.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

const nextRound = (): void => initiativeStore.nextRound();
const previousRound = (): void => initiativeStore.previousRound();
const nextTurn = (): void => initiativeStore.nextTurn();
const previousTurn = (): void => initiativeStore.previousTurn();

function getName(actor: InitiativeData): string {
    if (actor.localId === undefined) return "?";
    const props = propertiesState.reactive.data.get(actor.localId);
    if (props !== undefined) {
        if (props.nameVisible) return props.name;
        if (accessSystem.hasAccessTo(actor.localId, "edit")) return props.name;
    }
    return "?";
}

async function removeInitiative(actor: InitiativeData): Promise<void> {
    if (actor.isGroup) {
        const result = await loadConfirmationDialog(t("game.ui.initiative.remove_group_msg"));
        if (result) {
            initiativeStore.removeInitiative(actor.globalId, true);
        }
    } else {
        initiativeStore.removeInitiative(actor.globalId, true);
    }
}

function setEffectName(shape: GlobalId, index: number, name: string): void {
    if (initiativeStore.owns(shape)) initiativeStore.setEffectName(shape, index, name, true);
}

function setEffectTurns(shape: GlobalId, index: number, turns: string): void {
    if (initiativeStore.owns(shape)) initiativeStore.setEffectTurns(shape, index, turns, true);
}

function createTimedEffect(shape: GlobalId): void {
    if (initiativeStore.owns(shape)) initiativeStore.createTimedEffect(shape, undefined, true);
}

function createEffect(shape: GlobalId): void {
    if (initiativeStore.owns(shape)) initiativeStore.createEffect(shape, undefined, true);
}

function removeEffect(shape: GlobalId, index: number): void {
    if (initiativeStore.owns(shape)) initiativeStore.removeEffect(shape, index, true);
}

function toggleHighlight(actorId: LocalId | undefined, show: boolean): void {
    if (actorId === undefined) return;
    let shapeArray: Iterable<IShape>;
    const groupId = groupSystem.getGroupId(actorId);
    if (groupId === undefined) {
        const shape = getShape(actorId);
        if (shape === undefined) return;
        shapeArray = [shape];
    } else {
        shapeArray = map(groupSystem.getGroupMembers(groupId), (m) => getShape(m)!);
    }
    for (const sh of shapeArray) {
        sh.showHighlight = show;
        sh.layer?.invalidate(true);
    }
}

function hasImage(actor: InitiativeData): boolean {
    if (actor.localId === undefined) return false;
    return getShape(actor.localId)?.type === "assetrect";
}

function getImage(actor: InitiativeData): string {
    if (actor.localId === undefined) return "";
    return baseAdjust((getShape(actor.localId) as IAsset).src);
}

function canSee(actor: DeepReadonly<InitiativeData>): boolean {
    if (gameState.raw.isDm || actor.isVisible) return true;
    if (actor.localId === undefined) return false;
    return accessSystem.hasAccessTo(actor.localId, "edit");
}

function reset(): void {
    initiativeStore.setTurnCounter(0, InitiativeTurnDirection.Null, { sync: true, updateEffects: false });
    initiativeStore.setRoundCounter(1, InitiativeTurnDirection.Null, { sync: true, updateEffects: false });
    sendRequestInitiatives();
    scrollToInitiative();
}

function lock(globalId: GlobalId): void {
    if (initiativeStore.owns(globalId)) initiativeStore.lock(globalId);
}

function unlock(): void {
    if (initiativeStore.state.editLock !== undefined) initiativeStore.unlock();
}

function setInitiative(shape: GlobalId, value: string): void {
    const numValue = Number.parseInt(value);
    if (isNaN(numValue)) return;

    if (initiativeStore.owns(shape)) initiativeStore.setInitiative(shape, numValue, true);
}

function changeOrder(event: SortableEvent): void {
    const realEvent = event as DraggableEvent<InitiativeData>;
    if (gameState.raw.isDm && realEvent.newIndex !== realEvent.oldIndex)
        initiativeStore.changeOrder(realEvent.data.globalId, realEvent.oldIndex!, realEvent.newIndex!);
}

function changeSort(): void {
    if (gameState.raw.isDm) {
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
    uiSystem.setClientTab(ClientSettingCategory.Initiative);
    uiSystem.showClientSettings(true);
}

// shitty helper because draggable loses all type information :arghfist:
function n(e: any): number {
    return e as number;
}
</script>

<template>
    <Modal :visible="initiativeStore.state.showInitiative" :mask="false" extra-class="initiative-modal" @close="close">
        <template #header="m">
            <div class="modal-header" draggable="true" @dragstart="m.dragStart" @dragend="m.dragEnd">
                <div>{{ t("common.initiative") }}</div>
                <div class="header-close" :title="t('common.close')" @click.stop="close">
                    <font-awesome-icon :icon="['far', 'window-close']" />
                </div>
            </div>
        </template>
        <div class="modal-body">
            <div id="initiative-border-container">
                <div id="initiative-container" ref="list-element">
                    <Transition name="fade" mode="out-in">
                        <VueDraggable
                            v-if="hasVisibleActor"
                            id="initiative-list"
                            :model-value="initiativeStore.getDataSet()"
                            handle=".drag-handle"
                            ghost-class="moving-entry"
                            :animation="200"
                            @end="changeOrder"
                        >
                            <TransitionGroup name="initiative-slide">
                                <template v-for="(actor, index) of initiativeStore.getDataSet()" :key="actor.globalId">
                                    <div
                                        v-if="canSee(actor)"
                                        class="initiative-entry"
                                        :class="{ 'owned-actor': owns(actor.globalId) && !gameState.reactive.isDm }"
                                    >
                                        <div
                                            class="initiative-actor"
                                            :class="{
                                                'initiative-selected': initiativeStore.state.turnCounter === index,
                                                blurred:
                                                    initiativeStore.state.editLock !== undefined &&
                                                    initiativeStore.state.editLock !== actor.globalId,
                                            }"
                                            @mouseenter="toggleHighlight(actor.localId, true)"
                                            @mouseleave="toggleHighlight(actor.localId, false)"
                                        >
                                            <div
                                                v-if="owns(actor.globalId)"
                                                class="remove"
                                                :class="{ notAllowed: !owns(actor.globalId) }"
                                                @click="removeInitiative(actor)"
                                            >
                                                &#215;
                                            </div>
                                            <div v-if="gameState.reactive.isDm" class="drag-handle">
                                                <font-awesome-icon icon="grip-vertical" style="cursor: grab" />
                                            </div>
                                            <div v-else style="margin-right: 0.5rem"></div>
                                            <template v-if="hasImage(actor)">
                                                <img
                                                    :src="getImage(actor)"
                                                    :title="getName(actor)"
                                                    class="initiative-portrait"
                                                    alt=""
                                                />
                                            </template>
                                            <div
                                                v-else
                                                :title="getName(actor)"
                                                class="initiative-portrait empty-portrait"
                                            ></div>
                                            <div class="actor-info-cluster">
                                                <span class="actor-name" :title="getName(actor)">
                                                    {{ getName(actor) }}
                                                </span>
                                                <div class="actor-buttons">
                                                    <div
                                                        class="actor-icon-button"
                                                        :class="{ disabled: !owns(actor.globalId) }"
                                                        :title="t('common.toggle_public_private')"
                                                        @click="toggleOption(index, 'isVisible')"
                                                    >
                                                        <font-awesome-icon
                                                            icon="eye"
                                                            :style="{
                                                                cursor: !owns(actor.globalId) ? 'default' : 'pointer',
                                                                opacity: actor.isVisible ? '1.0' : '0.3',
                                                            }"
                                                        />
                                                    </div>
                                                    <div
                                                        class="actor-icon-button"
                                                        :class="{ disabled: !owns(actor.globalId) }"
                                                        :title="t('game.ui.initiative.toggle_group')"
                                                        @click="toggleOption(index, 'isGroup')"
                                                    >
                                                        <font-awesome-icon
                                                            icon="users"
                                                            :style="{
                                                                cursor: !owns(actor.globalId) ? 'default' : 'pointer',
                                                                opacity: actor.isGroup ? '1.0' : '0.3',
                                                            }"
                                                        />
                                                    </div>
                                                    <div class="actor-effect-button-group">
                                                        <div
                                                            class="actor-icon-button no-select"
                                                            :class="{ disabled: !owns(actor.globalId) }"
                                                            :title="t('game.ui.initiative.add_timed_effect')"
                                                            @click="createTimedEffect(actor.globalId)"
                                                        >
                                                            <font-awesome-icon
                                                                icon="stopwatch"
                                                                style="opacity: 0.6"
                                                                :style="{
                                                                    cursor: !owns(actor.globalId)
                                                                        ? 'default'
                                                                        : 'pointer',
                                                                }"
                                                            />
                                                        </div>
                                                        <div
                                                            class="actor-icon-button no-select"
                                                            :class="{ disabled: !owns(actor.globalId) }"
                                                            :title="t('game.ui.initiative.add_effect')"
                                                            @click="createEffect(actor.globalId)"
                                                        >
                                                            <font-awesome-icon
                                                                icon="wand-magic-sparkles"
                                                                style="opacity: 0.6"
                                                                :style="{
                                                                    cursor: !owns(actor.globalId)
                                                                        ? 'default'
                                                                        : 'pointer',
                                                                }"
                                                            />
                                                        </div>
                                                        <RollingCounter
                                                            :value="actor.effects.length"
                                                            :fixed-width="1"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <input
                                                class="initiative-value"
                                                type="text"
                                                :placeholder="t('common.value')"
                                                :value="actor.initiative"
                                                :disabled="!owns(actor.globalId)"
                                                :class="{ disabled: !owns(actor.globalId) }"
                                                @focus="lock(actor.globalId)"
                                                @blur="unlock"
                                                @change="setInitiative(actor.globalId, getValue($event))"
                                                @keyup.enter="getTarget($event).blur()"
                                            />
                                        </div>
                                        <Transition name="effects-expand">
                                            <div
                                                v-if="actor.effects.length > 0"
                                                class="initiative-effect"
                                                :class="{
                                                    'effect-visible': alwaysShowEffects,
                                                    'initiative-selected': initiativeStore.state.turnCounter === index,
                                                }"
                                            >
                                                <TransitionGroup name="effect-expand">
                                                    <div
                                                        v-for="(effect, e) of actor.effects"
                                                        :key="`${actor.globalId}-${e}`"
                                                        class="initiative-effect-info"
                                                    >
                                                        <input
                                                            v-model="effect.name"
                                                            type="text"
                                                            style="width: 100px"
                                                            :class="{ disabled: !owns(actor.globalId) }"
                                                            :disabled="!owns(actor.globalId)"
                                                            @change="
                                                                setEffectName(actor.globalId, n(e), getValue($event))
                                                            "
                                                            @keyup.enter="getTarget($event).blur()"
                                                        />
                                                        <input
                                                            v-if="effect.turns !== null"
                                                            v-model="effect.turns"
                                                            type="text"
                                                            class="effect-turn-counter"
                                                            :class="{ disabled: !owns(actor.globalId) }"
                                                            :disabled="!owns(actor.globalId)"
                                                            @change="
                                                                setEffectTurns(actor.globalId, n(e), getValue($event))
                                                            "
                                                            @keyup.enter="getTarget($event).blur()"
                                                        />
                                                        <div v-else class="effect-turn-counter infinite-placeholder">
                                                            &infin;
                                                        </div>
                                                        <div
                                                            v-if="owns(actor.globalId)"
                                                            class="actor-icon-button"
                                                            :title="t('game.ui.initiative.delete_effect')"
                                                            @click="removeEffect(actor.globalId, n(e))"
                                                        >
                                                            <font-awesome-icon icon="trash-alt" />
                                                        </div>
                                                        <div v-else style="margin-right: 4px"></div>
                                                    </div>
                                                </TransitionGroup>
                                            </div>
                                        </Transition>
                                    </div>
                                </template>
                            </TransitionGroup>
                        </VueDraggable>
                        <div v-else id="empty-placeholder">
                            {{ t("game.ui.initiative.empty_initiative") }}
                        </div>
                    </Transition>
                </div>
            </div>
            <div v-if="gameState.reactive.isDm" id="initiative-bar-dm">
                <div id="round-bar-dm">
                    <div
                        class="initiative-bar-button"
                        :title="t('game.ui.initiative.previous_round')"
                        @click="previousRound"
                    >
                        <font-awesome-icon icon="angle-double-left" />
                    </div>
                    <div class="initiative-bar-button" :title="t('game.ui.initiative.previous')" @click="previousTurn">
                        <font-awesome-icon icon="chevron-left" />
                    </div>
                    <div class="initiative-round-display">
                        <div>{{ t("game.ui.initiative.round_N") }}</div>
                        <RollingCounter :value="initiativeStore.state.roundCounter" :fixed-width="2" />
                    </div>
                    <div class="initiative-bar-button" :title="t('game.ui.initiative.next')" @click="nextTurn">
                        <font-awesome-icon icon="chevron-right" />
                    </div>
                    <div class="initiative-bar-button" :title="t('game.ui.initiative.next_round')" @click="nextRound">
                        <font-awesome-icon icon="angle-double-right" />
                    </div>
                </div>
                <div id="meta-bar-dm">
                    <div
                        class="initiative-bar-button"
                        :title="t('game.ui.initiative.clear_entries')"
                        @click="clearInitiativeEntries"
                    >
                        <font-awesome-icon icon="trash-alt" />
                    </div>
                    <div class="initiative-bar-button" :title="t('game.ui.initiative.reset_round')" @click="reset">
                        <font-awesome-icon icon="rotate-left" />
                    </div>
                    <div
                        class="initiative-bar-button"
                        :title="t('game.ui.initiative.clear')"
                        @click="clearInitiativeValues"
                    >
                        <font-awesome-icon icon="sync-alt" />
                    </div>
                    <div class="initiative-bar-button" :title="t('game.ui.initiative.change_sort')" @click="changeSort">
                        <font-awesome-icon
                            :key="initiativeStore.state.sort"
                            :icon="translateSort(initiativeStore.state.sort)"
                        />
                    </div>
                </div>
            </div>
            <div v-else>
                <div class="initiative-round-display">
                    <div>{{ t("game.ui.initiative.round_N") }}</div>
                    <RollingCounter :value="initiativeStore.state.roundCounter" :fixed-width="2" />
                </div>
            </div>
            <div id="initiative-settings" :title="t('game.ui.initiative.settings')" @click="openSettings">
                <font-awesome-icon icon="cog" />
            </div>
            <Transition name="zoom">
                <div v-if="confirmationDialog" class="initiative-confirm-dialog">
                    <span>{{ confirmationDialog.message }}</span>
                    <div>
                        <button @click="confirmation(true)">Yes</button>
                        <button @click="confirmation(false)">No</button>
                    </div>
                </div>
            </Transition>
        </div>
    </Modal>
</template>

<style lang="scss">
.initiative-modal {
    position: relative;
    width: fit-content;
    height: auto;
    overflow: hidden;
}
</style>

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
    overflow: hidden;
    padding: 10px;
}

#initiative-border-container {
    position: relative;
    border-radius: 0.35rem;
    overflow: hidden;
    &:before {
        pointer-events: none;
        content: "";
        border-radius: inherit;
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        box-shadow:
            inset 0 6px 10px -10px black,
            inset 0 -5px 13px -13px black,
            inset 4px 0 13px -13px black,
            inset -4px 0 13px -13px black;
    }
}

#initiative-container {
    overflow-y: scroll;
    overflow-x: hidden;
    min-width: 300px;
    min-height: 100px;
    height: 200px;
    resize: vertical;
    scrollbar-width: thin;
    padding: 5px 0;
}

#empty-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    font-style: italic;
    user-select: none;
    min-width: 275px;
    margin: 0 10px;
}

#initiative-list {
    position: relative;
    padding: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 275px;
    margin: 2px 0;
    scrollbar-color: #82c8a0 white;

    > div:nth-child(odd) {
        background-color: #e1eae5;
        scrollbar-color: #82c8a0 #e1eae5;
    }
}

.initiative-entry {
    border-radius: 5px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    margin: 2px 10px;
    outline: solid 2px rgba(130, 200, 160, 0.4);
    transition: box-shadow 0.2s ease;

    &.owned-actor {
        box-shadow:
            15px 0px 8px -10px #82c8a0,
            -15px 0px 8px -10px #82c8a0;
    }
}

.initiative-actor {
    z-index: 1;
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    padding: 2px 5px;
    padding-left: 0px;
    border-radius: 5px;
    position: relative;
    box-shadow: 0px 12px 5px -14px rgba(0, 0, 0, 0.75);
    margin: 0;
    margin-bottom: 2px;

    min-width: 275px;
    max-width: 275px;

    transition:
        background-color 0.15s linear,
        box-shadow 0.15s ease,
        border 0.15s ease,
        scale 0.15s ease;

    .remove {
        display: none;

        position: absolute;
        user-select: none;
        color: red;
        font-size: 25px;
        font-weight: bold;
        cursor: pointer;
        top: -15px;
        right: -8px;
    }

    &:hover {
        outline: solid 2px #82c8a0;

        > .remove {
            display: block;
        }
    }

    svg {
        width: 20px;
        margin: 0 1px;
    }

    .initiative-portrait {
        min-height: 50px;
        max-height: 50px;
        min-width: 50px;
        max-width: 50px;
        user-select: none;
        border-radius: 0.3rem;
    }
    .empty-portrait {
        border: black 1px solid;
    }

    .initiative-value {
        font-weight: 800;
        max-width: 2.75rem;
        height: 22px;
        padding: 2px;
        text-align: end;
        background-color: transparent;
        outline: none;
        border: solid 1px transparent;
        border-radius: 5px;
        transition: border-color 0.2s ease;
        flex: 0.25 1 0;
        font-family: Arial, sans-serif;
        font-size: 14pt;

        &:placeholder-shown {
            font-size: 11pt;
        }

        &:not(.disabled) {
            cursor: pointer;
        }
        &.disabled {
            border-color: transparent;
        }
        &:focus {
            border: solid 1px gray;
            box-shadow: 0px 0px 5px 2px lightblue;
        }
    }
    .drag-handle {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-width: 20px;
        align-self: stretch;
        cursor: grab;
        padding: 0 2px;
    }
    &.initiative-selected {
        background-color: #82c8a0;
        box-shadow: 0px 8px 10px -10px rgba(0, 0, 0, 0.75);
        scale: 103%;
    }
}

.actor-info-cluster {
    display: flex;
    flex-direction: column;
    justify-content: start;
    align-items: start;
    padding: 0 2px;
    flex: 1 0 0;
    max-width: 60%;
    overflow: hidden;
    user-select: none;

    mask-image: linear-gradient(to right, #000000ff 85%, transparent 95%);

    > .actor-name {
        margin: 2px 0;
        margin-left: 2px;
        text-wrap: nowrap;
    }

    > .actor-buttons {
        display: flex;
        flex-direction: row;
        justify-content: left;
        align-items: center;
        width: 100%;

        > .actor-effect-button-group {
            display: flex;
            align-items: center;
            border: solid 1px rgba(104, 125, 113, 0.6);
            border-radius: 0.25rem;
            padding: 1px;
            margin: 0 2px;
        }
    }

    :deep(.rolling-counter) {
        font-size: 14pt;
        opacity: 65%;
        margin: 0 3px;
    }
}
@-moz-document url-prefix() {
    .actor-info-cluster {
        :deep(.rolling-counter) {
            padding-bottom: 0.2em;
        }
    }
}

.actor-icon-button {
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
    border-radius: 0.25rem;
    transition: all 0.1s ease;
    svg {
        transition: all 0.1s ease;
    }
    &:hover:not(.disabled) {
        transform: scale(105%);
        cursor: pointer;
        background-color: rgba(104, 125, 113, 0.5);
    }
    &:hover.disabled {
        cursor: auto;
    }
    &:active:not(.disabled) {
        transform: scale(100%);
    }
    &.disabled {
        opacity: 50%;
    }
}

.blurred {
    filter: blur(5px);
}

.initiative-effect {
    display: none;
    flex-direction: column;
    width: -moz-fit-content;
    width: fit-content;
    margin-right: 5px;
    padding: 2px;
    border: solid 2px rgba(0, 0, 0, 0);
    border-bottom-left-radius: 5px;
    border-bottom-right-radius: 5px;
    border-top: none;
    max-height: 6.5rem;
    overflow-y: scroll;
    scrollbar-width: thin;

    transition:
        all 0.3s ease,
        box-shadow 0.1s linear,
        opacity 0.2s ease,
        max-height 0.3s ease;

    &.initiative-selected {
        background-color: #82c8a0;
        box-shadow: -2px 5px 6px -6px rgba(0, 0, 0, 0.75);
        scrollbar-color: #e1eae5 #82c8a0;
    }
}

.initiative-effect-info {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;

    > * {
        border: none;
        background-color: inherit;
        text-align: right;
        margin: 0 3px;

        &:first-child {
            margin-left: 0;
        }
        &:last-child {
            margin-right: 0;
        }
    }
    > input {
        font-size: 11pt;
    }
    .effect-turn-counter {
        width: 25px;
        padding: 0 2px;
    }
    .infinite-placeholder {
        user-select: none;
        font-size: 12pt;
    }
}

.initiative-selected + .initiative-effect,
.initiative-actor:hover + .initiative-effect,
.initiative-effect:hover,
.effect-visible {
    display: flex;
    border-color: rgba(130, 200, 160, 0.6);
}

#initiative-bar-dm {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-top: 10px;

    #round-bar-dm {
        display: flex;
        align-items: center;
        justify-content: center;
    }
    #meta-bar-dm {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 85%;
        div {
            margin: 0 2px;
        }
    }
}

.initiative-round-display {
    text-align: center;
    margin: 10px;
    position: relative;
    user-select: none;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 115%;
    height: fit-content;

    > * {
        margin: 0 2px;
    }
}

#initiative-settings {
    position: absolute;
    bottom: 10px;
    right: 10px;
    font-size: 90%;

    svg {
        transition:
            rotate 0.8s ease-in-out,
            scale 0.2s ease,
            filter 0.2s linear;
    }

    &:hover svg {
        rotate: 180deg;
        scale: 105%;
        transform-origin: center center;
        filter: drop-shadow(0px 0px 3px #82c8a0);
    }
    &:active svg {
        scale: 95%;
    }
}

.initiative-bar-button {
    display: flex;
    align-items: center;
    justify-content: center;
    border: solid 2px #82c8a0;
    border-radius: 5px;
    padding: 5px;

    transition:
        transform 0.1s linear,
        background-color 0.05s linear,
        color 0.05s linear,
        opacity 0.3s linear,
        border-color 0.1s linear;

    &:hover:not(.disabled) {
        transform: scale(110%);
        color: white;
        background-color: #82c8a0;
        cursor: pointer;
    }
    &:hover.disabled {
        cursor: auto;
    }
    &:active:not(.disabled) {
        transform: scale(100%);
    }
    &.disabled {
        border-color: #aaa;
        opacity: 50%;
    }
}

.initiative-confirm-dialog {
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #00000088;
    user-select: none;

    > span {
        padding: 5px;
        color: white;
        font-weight: bold;
        font-size: 1.1rem;
        text-align: center;
        background-color: #00000088;
    }
    > div {
        display: flex;
        > button {
            border-radius: 5px;
            border: solid 2px #82c8a0;
            margin: 5px;
            font-size: 1.1rem;
            transition: all 0.1s ease;
            &:hover {
                background-color: #82c8a0;
                color: white;
                transform: scale(102%);
                cursor: pointer;
            }
            &:active {
                transform: scale(98%);
            }
        }
    }
}

.moving-entry {
    opacity: 0;
}

// Transitions

.zoom-enter-from,
.zoom-leave-to {
    transform: scale(125%);
    opacity: 0;
}

.zoom-leave-active,
.zoom-enter-active {
    transition: all 0.15s ease;
}

.effects-expand-ente-active,
.effects-expand-leave-active {
    max-height: 2rem;
}
.effects-expand-enter-from,
.effects-expand-leave-to {
    opacity: 0;
    max-height: 0;
    margin-top: 0;
    margin-bottom: 0;
    padding-top: 0;
    padding-bottom: 0;
}

.effect-expand-enter-active {
    transition:
        all 0.3s ease,
        opacity 0.3s ease 0.05s;
    max-height: 1.5rem;
}
.effect-expand-leave-active {
    transition:
        all 0.3s ease,
        opacity 0.2s ease;
    max-height: 1.5rem;
}
.effect-expand-enter-from,
.effect-expand-leave-to {
    opacity: 0;
    max-height: 0;
}

.initiative-slide-enter-from,
.initiative-slide-leave-to {
    opacity: 0;
    transform: translateX(100%);
}
.initiative-slide-leave-active {
    transition:
        all 0.3s ease,
        opacity 0.2s ease;
}
.initiative-slide-enter-active {
    transition:
        all 0.3s ease,
        opacity 0.25s ease 0.05s;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
.fade-enter-active,
.fade-leave-active {
    transition: all 0.15s ease;
}
</style>

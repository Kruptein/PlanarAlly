<script lang="ts">
import { computed, defineComponent, onMounted, toRef, toRefs } from "vue";
import { useI18n } from "vue-i18n";
import draggable from "vuedraggable";

import Modal from "../../../core/components/modals/Modal.vue";
import { useModal } from "../../../core/plugins/modals/plugin";
import { clientStore } from "../../../store/client";
import { gameStore } from "../../../store/game";
import { UuidMap } from "../../../store/shapeMap";
import { uiStore } from "../../../store/ui";
import { sendRequestInitiatives } from "../../api/emits/initiative";
import { getGroupMembers } from "../../groups";
import { InitiativeData, InitiativeEffectMode, InitiativeSort } from "../../models/initiative";
import { Shape } from "../../shapes/shape";
import { Asset } from "../../shapes/variants/asset";
import { ClientSettingCategory } from "../settings/client/categories";

import { initiativeStore } from "./state";

export default defineComponent({
    components: { draggable, Modal },
    setup() {
        const { t } = useI18n();
        const modals = useModal();

        const isDm = toRef(gameStore.state, "isDm");

        onMounted(() => initiativeStore.show(false));

        const alwaysShowEffects = computed(
            () => clientStore.state.initiativeEffectVisibility === InitiativeEffectMode.Always,
        );

        function getName(actor: InitiativeData): string {
            const shape = UuidMap.get(actor.shape);
            if (shape !== undefined) {
                if (shape.nameVisible) return shape.name;
                if (shape.ownedBy(false, { editAccess: true })) return shape.name;
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

        function setEffectName(shape: string, index: number, name: string): void {
            if (initiativeStore.owns(shape)) initiativeStore.setEffectName(shape, index, name, true);
        }

        function setEffectTurns(shape: string, index: number, turns: string): void {
            if (initiativeStore.owns(shape)) initiativeStore.setEffectTurns(shape, index, turns, true);
        }

        function createEffect(shape: string): void {
            if (initiativeStore.owns(shape)) initiativeStore.createEffect(shape, undefined, true);
        }

        function removeEffect(shape: string, index: number): void {
            if (initiativeStore.owns(shape)) initiativeStore.removeEffect(shape, index, true);
        }

        function toggleHighlight(actorId: string, show: boolean): void {
            const shape = UuidMap.get(actorId);
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

        function hasImage(actor: InitiativeData): boolean {
            return UuidMap.get(actor.shape)?.type === "assetrect" ?? false;
        }

        function getImage(actor: InitiativeData): string {
            return (UuidMap.get(actor.shape)! as Asset).src;
        }

        function canSee(actor: InitiativeData): boolean {
            if (isDm.value || actor.isVisible) return true;
            const shape = UuidMap.get(actor.shape);
            if (shape === undefined) return false;
            return shape.ownedBy(false, { editAccess: true });
        }

        function reset(): void {
            initiativeStore.setRoundCounter(1, true);
            sendRequestInitiatives();
        }

        function lock(shape: string): void {
            if (initiativeStore.owns(shape)) initiativeStore.lock(shape);
        }

        function unlock(): void {
            if (initiativeStore.state.editLock !== "") initiativeStore.unlock();
        }

        function setInitiative(shape: string, value: string): void {
            const numValue = Number.parseInt(value);
            if (isNaN(numValue)) return;

            if (initiativeStore.owns(shape)) initiativeStore.setInitiative(shape, numValue, true);
        }

        function changeOrder(data: { moved?: { element: InitiativeData; newIndex: number; oldIndex: number } }): void {
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

        return {
            ...toRefs(initiativeStore.state),
            isDm,
            t,

            changeOrder,
            changeSort,
            translateSort,

            hasImage,
            getImage,
            getName,

            setInitiative,
            removeInitiative,
            reset,

            canSee,
            toggleHighlight,
            openSettings,

            createEffect,
            removeEffect,
            setEffectName,
            setEffectTurns,
            alwaysShowEffects,

            lock,
            unlock,

            close: () => initiativeStore.show(false),
            clearValues: () => initiativeStore.clearValues(true),
            nextTurn: () => initiativeStore.nextTurn(),
            previousTurn: () => initiativeStore.previousTurn(),
            owns: (actorId: string) => initiativeStore.owns(actorId),
            toggleOption: (index: number, option: "isVisible" | "isGroup") =>
                initiativeStore.toggleOption(index, option),
        };
    },
});
</script>

<template>
    <Modal :visible="showInitiative" @close="close" :mask="false">
        <template v-slot:header="m">
            <div class="modal-header" draggable="true" @dragstart="m.dragStart" @dragend="m.dragEnd">
                <div v-t="'common.initiative'"></div>
                <div class="header-close" @click="close" :title="t('common.close')">
                    <font-awesome-icon :icon="['far', 'window-close']" />
                </div>
            </div>
        </template>
        <div class="modal-body">
            <draggable
                id="initiative-list"
                :modelValue="locationData"
                @change="changeOrder"
                :disabled="!isDm"
                item-key="uuid"
            >
                <template #item="{ element: actor, index }">
                    <div style="display: flex; flex-direction: column; align-items: flex-end" v-if="canSee(actor)">
                        <div
                            class="initiative-actor"
                            :class="{
                                'initiative-selected': turnCounter === index,
                                blurred: editLock !== '' && editLock !== actor.shape,
                            }"
                            :style="{ cursor: isDm && 'move' }"
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
                                @change="setInitiative(actor.shape, $event.target.value)"
                                @keyup.enter="$event.target.blur()"
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
                                :title="t('game.ui.initiative.initiative.toggle_group')"
                            >
                                <font-awesome-icon icon="users" />
                            </div>
                            <div
                                class="initiative-effects-icon"
                                style="opacity: 0.6"
                                :class="{ notAllowed: !owns(actor.shape) }"
                                @click="createEffect(actor.shape)"
                                :title="t('game.ui.initiative.initiative.add_timed_effect')"
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
                                    @change="setEffectName(actor.shape, e, $event.target.value)"
                                />
                                <input
                                    type="text"
                                    v-model="effect.turns"
                                    :style="{ width: '25px' }"
                                    :class="{ notAllowed: !owns(actor.shape) }"
                                    :disabled="!owns(actor.shape)"
                                    @change="setEffectTurns(actor.shape, e, $event.target.value)"
                                />
                                <div
                                    :style="{ opacity: owns(actor.shape) ? '1.0' : '0.3' }"
                                    :class="{ notAllowed: !owns(actor.shape) }"
                                    @click="removeEffect(actor.shape, e)"
                                    :title="t('game.ui.initiative.initiative.delete_effect')"
                                >
                                    <font-awesome-icon icon="trash-alt" />
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </draggable>
            <div id="initiative-bar-dm" v-if="isDm">
                <div
                    class="initiative-bar-button"
                    @click="reset"
                    :title="t('game.ui.initiative.initiative.reset_round')"
                >
                    <font-awesome-icon icon="angle-double-left" />
                </div>
                <div
                    class="initiative-bar-button"
                    @click="previousTurn"
                    :title="t('game.ui.initiative.initiative.previous')"
                >
                    <font-awesome-icon icon="chevron-left" />
                </div>
                <div
                    class="initiative-bar-button"
                    @click="clearValues"
                    :title="t('game.ui.initiative.initiative.clear')"
                >
                    <font-awesome-icon icon="sync-alt" />
                </div>
                <div
                    class="initiative-bar-button"
                    @click="changeSort"
                    :title="t('game.ui.initiative.initiative.change_sort')"
                >
                    <font-awesome-icon :icon="translateSort(sort)" :key="sort" />
                </div>
                <div
                    class="initiative-bar-button"
                    :class="{ notAllowed: !isDm }"
                    @click="nextTurn"
                    :title="t('game.ui.initiative.initiative.next')"
                >
                    <font-awesome-icon icon="chevron-right" />
                </div>
            </div>
            <div id="initiative-round">
                {{ t("game.ui.initiative.initiative.round_N", roundCounter) }}

                <div
                    id="initiative-settings"
                    class="initiative-bar-button"
                    @click="openSettings"
                    :title="t('game.ui.initiative.initiative.next')"
                >
                    <font-awesome-icon icon="cog" />
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

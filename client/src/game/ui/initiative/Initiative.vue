<script lang="ts">
import { defineComponent, toRef, toRefs } from "vue";
import { useI18n } from "vue-i18n";
import draggable from "vuedraggable";

import Modal from "../../../core/components/modals/Modal.vue";
import { useModal } from "../../../core/plugins/modals/plugin";
import { gameStore } from "../../../store/game";
import { UuidMap } from "../../../store/shapeMap";
import { getGroupMembers } from "../../groups";
import { InitiativeData } from "../../models/general";
import { Shape } from "../../shapes/shape";

import { initiativeStore } from "./state";

export default defineComponent({
    components: { draggable, Modal },
    setup() {
        const { t } = useI18n();
        const modals = useModal();

        const isDm = toRef(gameStore.state, "isDm");

        function getName(actor: InitiativeData): string {
            const shape = UuidMap.get(actor.uuid);
            if (shape !== undefined) {
                if (shape.nameVisible) return shape.name;
                if (shape.ownedBy(false, { editAccess: true })) return shape.name;
            }
            return actor.source;
        }

        async function removeInitiative(actor: InitiativeData): Promise<void> {
            if (actor.group) {
                const continueRemoval = await modals.confirm(
                    "Removing initiative",
                    "Are you sure you wish to remove this group from the initiative order?",
                );
                if (continueRemoval !== true) {
                    return;
                }
            }
            initiativeStore.removeInitiative(actor.uuid, true);
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

        return {
            ...toRefs(initiativeStore.state),
            isDm,
            t,
            getName,
            removeInitiative,
            toggleHighlight,
            close: () => initiativeStore.show(false),
            createEffect: (actorId: string) => initiativeStore.createEffect(actorId, undefined, true),
            removeEffect: (actorId: string, effect: string) => initiativeStore.removeEffect(actorId, effect, true),
            setEffectName: (actorId: string, effect: string, name: string) =>
                initiativeStore.setEffectName(actorId, effect, name, true),
            setEffectTurns: (actorId: string, effect: string, turns: number) =>
                initiativeStore.setEffectTurns(actorId, effect, turns, true),
            nextTurn: () => initiativeStore.nextTurn(),
            owns: (actor: InitiativeData) => initiativeStore.owns(actor),
            setLock: (lock: boolean) => initiativeStore.setLock(lock),
            setRoundCounter: (round: number) => initiativeStore.setRoundCounter(round, true),
            setCameraLock: (lock: boolean) => initiativeStore.setCameraLock(lock),
            setVisionLock: (lock: boolean) => initiativeStore.setVisionLock(lock),
            toggleOption: (actorId: string, option: "visible" | "group") =>
                initiativeStore.toggleOption(actorId, option),
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
            <!-- @change="updateOrder"
                :setData="fakeSetData" -->
            <draggable id="initiative-list" v-model="data" :disabled="!isDm" item-key="uuid">
                <template #item="{ element: actor }">
                    <div style="display: flex; flex-direction: column; align-items: flex-end">
                        <div
                            class="initiative-actor"
                            :class="{ 'initiative-selected': currentActor === actor.uuid }"
                            :style="{ cursor: isDm && 'move' }"
                            @mouseenter="toggleHighlight(actor.uuid, true)"
                            @mouseleave="toggleHighlight(actor.uuid, false)"
                        >
                            <template v-if="actor.has_img">
                                <img :src="actor.source" :title="getName(actor)" alt="" />
                            </template>
                            <template v-else>
                                <span style="width: auto">{{ getName(actor) }}</span>
                            </template>
                            <!-- @change="syncInitiative(actor)" -->
                            <input
                                type="text"
                                :placeholder="t('common.value')"
                                v-model.lazy.number="actor.initiative"
                                :disabled="!owns(actor)"
                                :class="{ notAllowed: !owns(actor) }"
                                @focus="setLock(true)"
                                @blur="setLock(false)"
                            />
                            <div
                                class="initiative-effects-icon"
                                style="opacity: 0.6"
                                :class="{ notAllowed: !owns(actor) }"
                                @click="createEffect(actor.uuid)"
                                :title="t('game.ui.initiative.initiative.add_timed_effect')"
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
                                @click="toggleOption(actor.uuid, 'visible')"
                                :title="t('common.toggle_public_private')"
                            >
                                <font-awesome-icon icon="eye" />
                            </div>
                            <div
                                :style="{ opacity: actor.group ? '1.0' : '0.3' }"
                                :class="{ notAllowed: !owns(actor) }"
                                @click="toggleOption(actor.uuid, 'group')"
                                :title="t('game.ui.initiative.initiative.toggle_group')"
                            >
                                <font-awesome-icon icon="users" />
                            </div>
                            <div
                                :style="{ opacity: owns(actor) ? '1.0' : '0.3' }"
                                :class="{ notAllowed: !owns(actor) }"
                                @click="removeInitiative(actor)"
                                :title="t('game.ui.initiative.initiative.delete_init')"
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
                                    @change="setEffectName(actor.uuid, effect.uuid, $event.target.value)"
                                />
                                <input
                                    type="text"
                                    v-model="effect.turns"
                                    :size="effect.turns.toString().length || 1"
                                    @change="setEffectTurns(actor.uuid, effect.uuid, $event.target.value)"
                                />
                                <div
                                    :style="{ opacity: owns(actor) ? '1.0' : '0.3' }"
                                    :class="{ notAllowed: !owns(actor) }"
                                    @click="removeEffect(actor.uuid, effect.uuid)"
                                    :title="t('game.ui.initiative.initiative.delete_effect')"
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
                    {{ t("game.ui.initiative.initiative.round_N", roundCounter) }}
                </div>
                <div style="display: flex"></div>
                <div
                    class="initiative-bar-button"
                    :style="visionLock ? 'background-color: #82c8a0' : ''"
                    @click="setVisionLock(!visionLock)"
                    :title="t('game.ui.initiative.initiative.vision_log_msg')"
                >
                    <font-awesome-icon icon="eye" />
                </div>
                <div
                    class="initiative-bar-button"
                    :style="cameraLock ? 'background-color: #82c8a0' : ''"
                    @click="setCameraLock(!cameraLock)"
                    :title="t('game.ui.initiative.initiative.camera_log_msg')"
                >
                    <font-awesome-icon icon="video" />
                </div>
                <div
                    class="initiative-bar-button"
                    :class="{ notAllowed: !isDm }"
                    @click="setRoundCounter(1)"
                    :title="t('game.ui.initiative.initiative.reset_round')"
                >
                    <font-awesome-icon icon="sync-alt" />
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

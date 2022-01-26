<script lang="ts" setup>
import { watch } from "vue";
import type { DeepReadonly } from "vue";
import { useI18n } from "vue-i18n";
import draggable from "vuedraggable";

import Modal from "../../../../core/components/modals/Modal.vue";
import { useModal } from "../../../../core/plugins/modals/plugin";
import { gameStore } from "../../../../store/game";
import type { Conditions } from "../../../models/logic";

const { t } = useI18n();

const modals = useModal();

const props = defineProps<{
    conditions: DeepReadonly<Conditions>;
    visible: boolean;
}>();
const emit = defineEmits<{
    (e: "update:conditions", conditions: Conditions): Conditions;
    (e: "update:visible", visible: boolean): void;
    (e: "close"): void;
}>();

let conditions = getConditionCopy();

watch(
    () => props.conditions,
    () => (conditions = getConditionCopy()),
);

type SortableChanged<T> = {
    added?: { element: T; newIndex: number };
    moved?: { element: T; newIndex: number; oldIndex: number };
    removed?: { element: T; oldIndex: number };
};

function getConditionCopy(): Conditions {
    return {
        enabled: [...props.conditions.enabled],
        request: [...props.conditions.request],
        disabled: [...props.conditions.disabled],
    };
}

function change(change: SortableChanged<string>, target: "enabled" | "request" | "disabled"): void {
    const _target =
        target === "enabled" ? conditions.enabled : target === "disabled" ? conditions.disabled : conditions.request;
    if (change.added) {
        _target.splice(change.added.newIndex, 0, change.added.element);
    } else if (change.removed) {
        _target.splice(change.removed.oldIndex, 1);
    } else if (change.moved) {
        _target.splice(change.moved.oldIndex, 1);
        _target.splice(change.moved.newIndex, 0, change.moved.element);
    }
    emit("update:conditions", conditions);
}

async function add(target: "enabled" | "request" | "disabled"): Promise<void> {
    const players = gameStore.state.players;
    const selection = await modals.selectionBox(
        "Select a player",
        players
            .map((p) => p.name)
            .filter(
                (p) =>
                    !(
                        conditions.enabled.includes(p) ||
                        conditions.request.includes(p) ||
                        conditions.disabled.includes(p)
                    ),
            ),
        { multiSelect: true },
    );
    if (selection === undefined) return;

    const _target =
        target === "enabled" ? conditions.enabled : target === "disabled" ? conditions.disabled : conditions.request;

    for (const s of selection) {
        _target.push(s);
    }
    emit("update:conditions", conditions);
}

function hideModal(): void {
    emit("update:visible", false);
}
</script>

<template>
    <Modal :visible="visible" @close="emit('close')">
        <template v-slot:header="m">
            <div class="modal-header" draggable="true" @dragstart="m.dragStart" @dragend="m.dragEnd">
                Configure logic permissions
                <div class="header-close" @click="hideModal" :title="t('common.close')">
                    <font-awesome-icon :icon="['far', 'window-close']" />
                </div>
            </div>
        </template>
        <div class="modal-body">
            <span class="condition-header">Enabled</span>
            <span class="condition-header">Request</span>
            <span class="condition-header">Disabled</span>

            <draggable
                class="condition-sorter"
                :modelValue="props.conditions.enabled"
                group="door"
                @change="change($event, 'enabled')"
                item-key="uuid"
            >
                <template #item="{ element }">
                    <div>{{ element }}</div>
                </template>

                <template #footer>
                    <div @click="add('enabled')">Add</div>
                </template>
            </draggable>
            <draggable
                class="condition-sorter"
                :modelValue="props.conditions.request"
                group="door"
                @change="change($event, 'request')"
                item-key="uuid"
            >
                <template #item="{ element }">
                    <div>{{ element }}</div>
                </template>

                <template #footer>
                    <div @click="add('request')">Add</div>
                </template>
            </draggable>
            <draggable
                class="condition-sorter"
                :modelValue="props.conditions.disabled"
                group="door"
                @change="change($event, 'disabled')"
                item-key="uuid"
            >
                <template #item="{ element }">
                    <div>{{ element }}</div>
                </template>

                <template #footer>
                    <div @click="add('disabled')">Add</div>
                </template>
            </draggable>
        </div>
    </Modal>
</template>

<style lang="scss" scoped>
.modal-header {
    background-color: #ff7052;
    padding: 10px;
    padding-right: 35px;
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
    display: grid;
    grid-template-columns: [enabled] 60px [request] 60px [disabled] 60px [end];
    grid-column-gap: 5px;
    align-items: start;
    justify-content: space-around;
    padding-top: 1em;
    padding-bottom: 1em;

    font-weight: normal;

    .condition-header {
        font-weight: bold;
        text-decoration: underline;
        margin-bottom: 10px;
    }

    .condition-sorter {
        display: flex;
        flex-direction: column;

        > div {
            margin-bottom: 5px;

            &:hover {
                cursor: grab;
                font-style: italic;
            }

            &:last-child {
                font-style: italic;
                margin-top: 5px;

                &:hover {
                    cursor: pointer;
                    font-weight: bold;
                }
            }
        }
    }
}
</style>

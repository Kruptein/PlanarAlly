<script lang="ts" setup>
import { watch } from "vue";
import type { DeepReadonly } from "vue";
import { useI18n } from "vue-i18n";
import draggable from "vuedraggable";

import Modal from "../../../../core/components/modals/Modal.vue";
import { useModal } from "../../../../core/plugins/modals/plugin";
import { copyPermissions } from "../../../systems/logic/common";
import type { Permissions } from "../../../systems/logic/models";
import { playerState } from "../../../systems/players/state";

const { t } = useI18n();

const modals = useModal();

const props = defineProps<{
    permissions: DeepReadonly<Permissions>;
    visible: boolean;
}>();
const emit = defineEmits<{
    (e: "update:permissions", permissions: Permissions): Permissions;
    (e: "update:visible", visible: boolean): void;
    (e: "close"): void;
}>();

// We have multiple sortables
// when moving a value from one to the other we get a 'deleted' and 'added' event
// the first event received will however be the intermediate state and we don't want to emit that
// so we keep track of pending actions in this set
// side-note: the order _seems_ deterministic in that it always first sends added and then deleted
//            but this might be an implementation detail that changes when upgrading the sortable dependency
const pendingEvents = new Set<string>();

let permissions = copyPermissions(props.permissions);

watch(
    () => props.permissions,
    () => (permissions = copyPermissions(props.permissions)),
);

interface SortableChanged<T> {
    added?: { element: T; newIndex: number };
    moved?: { element: T; newIndex: number; oldIndex: number };
    removed?: { element: T; oldIndex: number };
}

function change(change: Event & SortableChanged<string>, target: "enabled" | "request" | "disabled"): void {
    const _target =
        target === "enabled" ? permissions.enabled : target === "disabled" ? permissions.disabled : permissions.request;
    if (change.added) {
        _target.splice(change.added.newIndex, 0, change.added.element);
        if (pendingEvents.has(change.added.element)) emit("update:permissions", permissions);
        else pendingEvents.add(change.added.element);
    } else if (change.removed) {
        _target.splice(change.removed.oldIndex, 1);
        if (pendingEvents.has(change.removed.element)) emit("update:permissions", permissions);
        else pendingEvents.add(change.removed.element);
    } else if (change.moved) {
        _target.splice(change.moved.oldIndex, 1);
        _target.splice(change.moved.newIndex, 0, change.moved.element);
        emit("update:permissions", permissions);
    }
}

async function add(target: "enabled" | "request" | "disabled"): Promise<void> {
    const players = playerState.raw.players;
    const selection = await modals.selectionBox(
        "Select a player",
        [...players.values()]
            .map((p) => p.name)
            .filter(
                (p) =>
                    !(
                        permissions.enabled.includes(p) ||
                        permissions.request.includes(p) ||
                        permissions.disabled.includes(p)
                    ),
            ),
        { multiSelect: true },
    );
    if (selection === undefined) return;

    const _target =
        target === "enabled" ? permissions.enabled : target === "disabled" ? permissions.disabled : permissions.request;

    for (const s of selection) {
        _target.push(s);
    }
    emit("update:permissions", permissions);
}

function hideModal(): void {
    emit("update:visible", false);
}
</script>

<template>
    <Modal :visible="visible" @close="emit('close')">
        <template #header="m">
            <div class="modal-header" draggable="true" @dragstart="m.dragStart" @dragend="m.dragEnd">
                {{ t("game.ui.selection.edit_dialog.logic.permissions.title") }}
                <div class="header-close" :title="t('common.close')" @click.stop="hideModal">
                    <font-awesome-icon :icon="['far', 'window-close']" />
                </div>
            </div>
        </template>
        <div class="modal-body">
            <span class="condition-header">{{ t("common.enabled") }}</span>
            <span class="condition-header">{{ t("game.ui.selection.edit_dialog.logic.permissions.request") }}</span>
            <span class="condition-header">{{ t("game.ui.selection.edit_dialog.logic.permissions.disabled") }}</span>

            <draggable
                class="condition-sorter"
                :model-value="props.permissions.enabled.filter((x) => x !== null)"
                group="door"
                item-key="uuid"
                @change="change($event, 'enabled')"
            >
                <template #item="{ element }: { element: string }">
                    <div>{{ element }}</div>
                </template>

                <template #footer>
                    <div @click="add('enabled')">{{ t("common.add") }}</div>
                </template>
            </draggable>
            <draggable
                class="condition-sorter"
                :model-value="props.permissions.request.filter((x) => x !== null)"
                group="door"
                item-key="uuid"
                @change="change($event, 'request')"
            >
                <template #item="{ element }: { element: string }">
                    <div>{{ element }}</div>
                </template>

                <template #footer>
                    <div @click="add('request')">{{ t("common.add") }}</div>
                </template>
            </draggable>
            <draggable
                class="condition-sorter"
                :model-value="props.permissions.disabled.filter((x) => x !== null)"
                group="door"
                item-key="uuid"
                @change="change($event, 'disabled')"
            >
                <template #item="{ element }: { element: string }">
                    <div>{{ element }}</div>
                </template>

                <template #footer>
                    <div @click="add('disabled')">{{ t("common.add") }}</div>
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

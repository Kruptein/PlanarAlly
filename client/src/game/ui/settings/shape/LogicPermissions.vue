<script lang="ts" setup>
import type { SortableEvent } from "sortablejs";
import { watch } from "vue";
import type { DeepReadonly } from "vue";
import { VueDraggable } from "vue-draggable-plus";
import { useI18n } from "vue-i18n";

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

let permissions = copyPermissions(props.permissions);

watch(
    () => props.permissions,
    () => (permissions = copyPermissions(props.permissions)),
);

function onEnd(event: SortableEvent): void {
    const realEvent = event as SortableEvent & { data: string };
    const toName = realEvent.to.dataset.name;
    const fromName = realEvent.from.dataset.name;
    const toList =
        toName === "enabled" ? permissions.enabled : toName === "disabled" ? permissions.disabled : permissions.request;
    const fromList =
        fromName === "enabled"
            ? permissions.enabled
            : fromName === "disabled"
              ? permissions.disabled
              : permissions.request;

    fromList.splice(realEvent.oldIndex!, 1);
    toList.splice(realEvent.newIndex!, 0, realEvent.data);
    emit("update:permissions", permissions);
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

            <VueDraggable
                class="condition-sorter"
                :model-value="props.permissions.enabled.filter((x) => x !== null)"
                group="door"
                data-name="enabled"
                @end="onEnd"
            >
                <div v-for="element of props.permissions.enabled.filter((x) => x !== null)" :key="element">
                    {{ element }}
                </div>
            </VueDraggable>
            <VueDraggable
                class="condition-sorter"
                :model-value="props.permissions.request.filter((x) => x !== null)"
                group="door"
                data-name="request"
                @end="onEnd"
            >
                <div v-for="element of props.permissions.request.filter((x) => x !== null)" :key="element">
                    {{ element }}
                </div>

                <template #footer>
                    <div @click="add('request')">{{ t("common.add") }}</div>
                </template>
            </VueDraggable>
            <VueDraggable
                class="condition-sorter"
                :model-value="props.permissions.disabled.filter((x) => x !== null)"
                group="door"
                data-name="disabled"
                @end="onEnd"
            >
                <div v-for="element of props.permissions.disabled.filter((x) => x !== null)" :key="element">
                    {{ element }}
                </div>

                <template #footer>
                    <div @click="add('disabled')">{{ t("common.add") }}</div>
                </template>
            </VueDraggable>
            <div class="condition-footer" @click="add('enabled')">{{ t("common.add") }}</div>
            <div class="condition-footer" @click="add('request')">{{ t("common.add") }}</div>
            <div class="condition-footer" @click="add('disabled')">{{ t("common.add") }}</div>
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
    grid-template-columns: [enabled] 70px [request] 70px [disabled] 70px [end];
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
        text-align: center;
    }

    .condition-sorter {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        min-height: 2rem;
        height: 100%;

        > div {
            margin-bottom: 5px;

            &:hover {
                cursor: grab;
                font-style: italic;
            }
        }
    }
    .condition-footer {
        border-top: solid 1px black;
        padding: 5px 2px;
        text-align: center;
        &:hover {
            cursor: pointer;
            font-weight: bold;
        }
    }
}
</style>

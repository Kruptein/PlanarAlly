<script setup lang="ts">
import { useI18n } from "vue-i18n";

import { SyncTo } from "../../core/models/types";
import { useModal } from "../../core/plugins/modals/plugin";
import { activeShapeStore } from "../../store/activeShape";
import { UuidMap } from "../../store/shapeMap";
import type { Aura, Tracker } from "../shapes/interfaces";

const { t } = useI18n();
const modals = useModal();

const shape = activeShapeStore.state;

function setLocked(): void {
    if (activeShapeStore.hasEditAccess.value) {
        activeShapeStore.setLocked(!shape.isLocked, SyncTo.SERVER);
    }
}

function openEditDialog(): void {
    activeShapeStore.setShowEditDialog(true);
}

async function changeValue(tracker: Tracker | Aura, isAura: boolean): Promise<void> {
    if (shape.uuid === undefined) return;

    const input = await modals.prompt(
        t("game.ui.selection.SelectionInfo.new_value_NAME", { name: tracker.name }),
        t("game.ui.selection.SelectionInfo.updating_NAME", { name: tracker.name }),
    );

    if (input === undefined || shape.uuid === undefined) return;

    let value = parseInt(input, 10);
    if (isNaN(value)) {
        return;
    }

    if (input[0] === "+" || input[0] === "-") {
        value += tracker.value;
    }

    if (isAura) {
        activeShapeStore.updateAura(tracker.uuid, { value }, SyncTo.SERVER);
        const sh = UuidMap.get(shape.uuid)!;
        sh.invalidate(false);
    } else {
        activeShapeStore.updateTracker(tracker.uuid, { value }, SyncTo.SERVER);
    }
}
</script>

<template>
    <div>
        <template v-if="shape.uuid !== undefined">
            <div id="selection-menu">
                <div id="selection-lock-button" @click="setLocked" :title="t('game.ui.selection.SelectionInfo.lock')">
                    <font-awesome-icon v-if="shape.isLocked" icon="lock" />
                    <font-awesome-icon v-else icon="unlock" />
                </div>
                <div
                    id="selection-edit-button"
                    @click="openEditDialog"
                    :title="t('game.ui.selection.SelectionInfo.open_shape_props')"
                >
                    <font-awesome-icon icon="edit" />
                </div>
                <div id="selection-name">{{ shape.name }}</div>
                <div id="selection-trackers">
                    <template v-for="tracker in shape.trackers.slice(0, shape.trackers.length - 1)" :key="tracker.uuid">
                        <div>{{ tracker.name }}</div>
                        <div
                            class="selection-tracker-value"
                            @click="changeValue(tracker, false)"
                            :title="t('game.ui.selection.SelectionInfo.quick_edit_tracker')"
                        >
                            <template v-if="tracker.maxvalue === 0">
                                {{ tracker.value }}
                            </template>
                            <template v-else>{{ tracker.value }} / {{ tracker.maxvalue }}</template>
                        </div>
                    </template>
                </div>
                <div id="selection-auras">
                    <template v-for="aura in shape.auras.slice(0, shape.auras.length - 1)" :key="aura.uuid">
                        <div>{{ aura.name }}</div>
                        <div
                            class="selection-tracker-value"
                            @click="changeValue(aura, true)"
                            :title="t('game.ui.selection.SelectionInfo.quick_edit_aura')"
                        >
                            <template v-if="aura.dim === 0">
                                {{ aura.value }}
                            </template>
                            <template v-else>{{ aura.value }} / {{ aura.dim }}</template>
                        </div>
                    </template>
                </div>
            </div>
        </template>
    </div>
</template>

<style scoped lang="scss">
#selection-menu {
    position: absolute;
    pointer-events: auto;
    display: flex;
    flex-direction: column;
    top: 75px;
    right: 0;
    z-index: 10;
    opacity: 0.5;
    border-top-left-radius: 5px;
    border-bottom-left-radius: 5px;
    border: #82c8a0 solid 1px;
    border-right: none;
    padding: 10px 35px 10px 10px;
    background-color: #eee;

    &:hover {
        background-color: #82c8a0;
        opacity: 1;
    }
}

#selection-lock-button {
    position: absolute;
    right: 13px;
    top: 30px;
    cursor: pointer;
}

#selection-edit-button {
    position: absolute;
    right: 10px;
    top: 10px;
    cursor: pointer;
}

#selection-trackers,
#selection-auras {
    display: grid;
    grid-template-columns: [name] 1fr [value] 1fr;
}

.selection-tracker-value,
.selection-aura-value {
    justify-self: center;
    padding: 2px;

    &:hover {
        cursor: pointer;
        background-color: rgba(20, 20, 20, 0.2);
    }
}

#selection-name {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 10px;
}
</style>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

import { SyncTo } from "../../../../core/models/types";
import { activeShapeStore } from "../../../../store/activeShape";
import { gameStore } from "../../../../store/game";
import type { ShapeOwner } from "../../../shapes/owners";

const { t } = useI18n();

const accessDropdown = ref<HTMLSelectElement | null>(null);

const owned = activeShapeStore.hasEditAccess;
const hasDefaultEditAccess = activeShapeStore.hasDefaultEditAccess;
const hasDefaultMovementAccess = activeShapeStore.hasDefaultMovementAccess;
const hasDefaultVisionAccess = activeShapeStore.hasDefaultVisionAccess;

const playersWithoutAccess = computed(() =>
    gameStore.state.players.filter((p) => !activeShapeStore.state.owners.some((o) => o.user === p.name)),
);

function addOwner(): void {
    if (!owned.value) return;
    const dropdown = accessDropdown.value!;
    const selectedUser = dropdown.options[dropdown.selectedIndex].value;
    if (selectedUser === "") return;
    activeShapeStore.addOwner(
        {
            shape: activeShapeStore.state.id!,
            user: selectedUser,
            access: { edit: true, movement: true, vision: true },
        },
        SyncTo.SERVER,
    );
}

function removeOwner(owner: string): void {
    if (!owned.value) return;
    activeShapeStore.removeOwner(owner, SyncTo.SERVER);
}

function toggleDefaultEditAccess(): void {
    if (!owned.value) return;
    activeShapeStore.setDefaultEditAccess(!activeShapeStore.hasDefaultEditAccess.value, SyncTo.SERVER);
}

function toggleDefaultMovementAccess(): void {
    if (!owned.value) return;
    activeShapeStore.setDefaultMovementAccess(!activeShapeStore.hasDefaultMovementAccess.value, SyncTo.SERVER);
}

function toggleDefaultVisionAccess(): void {
    if (!owned.value) return;
    activeShapeStore.setDefaultVisionAccess(!activeShapeStore.hasDefaultVisionAccess.value, SyncTo.SERVER);
}

function toggleOwnerEditAccess(owner: ShapeOwner): void {
    if (!owned.value) return;
    // un-reactify it, because we want to check on access permissions in updateOwner
    // otherwise one would never be able to remove their edit access rights
    const copy = { ...owner, access: { ...owner.access } };
    copy.access.edit = !copy.access.edit;
    if (copy.access.edit) {
        copy.access.movement = true;
        copy.access.vision = true;
    }
    activeShapeStore.updateOwner(copy, SyncTo.SERVER);
}

function toggleOwnerMovementAccess(owner: ShapeOwner): void {
    if (!owned.value) return;
    const copy = { ...owner, access: { ...owner.access } };
    copy.access.movement = !copy.access.movement;
    if (copy.access.movement) {
        copy.access.vision = true;
    } else {
        copy.access.edit = false;
    }
    activeShapeStore.updateOwner(copy, SyncTo.SERVER);
}

function toggleOwnerVisionAccess(owner: ShapeOwner): void {
    if (!owned.value) return;
    const copy = { ...owner, access: { ...owner.access } };
    copy.access.vision = !copy.access.vision;
    if (!copy.access.vision) {
        copy.access.edit = false;
        copy.access.movement = false;
    }
    activeShapeStore.updateOwner(copy, SyncTo.SERVER);
}
</script>

<template>
    <div class="panel restore-panel">
        <div class="spanrow header">{{ t("game.ui.selection.edit_dialog.access.access") }}</div>
        <div class="owner">
            <em>{{ t("game.ui.selection.edit_dialog.access.default") }}</em>
        </div>
        <div
            :style="{
                opacity: hasDefaultEditAccess ? 1.0 : 0.3,
                textAlign: 'center',
            }"
            :disabled="!owned"
            @click="toggleDefaultEditAccess"
            :title="t('game.ui.selection.edit_dialog.access.toggle_edit_access')"
        >
            <font-awesome-icon icon="pencil-alt" />
        </div>
        <div
            :style="{ opacity: hasDefaultMovementAccess ? 1.0 : 0.3, textAlign: 'center' }"
            :disabled="!owned"
            @click="toggleDefaultMovementAccess"
            :title="t('game.ui.selection.edit_dialog.access.toggle_movement_access')"
        >
            <font-awesome-icon icon="arrows-alt" />
        </div>
        <div
            :style="{ opacity: hasDefaultVisionAccess ? 1.0 : 0.3, textAlign: 'center' }"
            :disabled="!owned"
            @click="toggleDefaultVisionAccess"
            :title="t('game.ui.selection.edit_dialog.access.toggle_vision_access')"
        >
            <font-awesome-icon icon="lightbulb" />
        </div>
        <template v-for="owner in activeShapeStore.state.owners" :key="owner.user">
            <div class="owner">
                {{ owner.user }}
            </div>
            <div
                :style="{
                    opacity: owner.access.edit ? 1.0 : 0.3,
                    textAlign: 'center',
                }"
                :disabled="!owned"
                @click="toggleOwnerEditAccess(owner)"
                :title="t('game.ui.selection.edit_dialog.access.toggle_edit_access')"
            >
                <font-awesome-icon icon="pencil-alt" />
            </div>
            <div
                :style="{ opacity: owner.access.movement ? 1.0 : 0.3, textAlign: 'center' }"
                :disabled="!owned"
                @click="toggleOwnerMovementAccess(owner)"
                :title="t('game.ui.selection.edit_dialog.access.toggle_movement_access')"
            >
                <font-awesome-icon icon="arrows-alt" />
            </div>
            <div
                :style="{ opacity: owner.access.vision ? 1.0 : 0.3, textAlign: 'center' }"
                :disabled="!owned"
                @click="toggleOwnerVisionAccess(owner)"
                :title="t('game.ui.selection.edit_dialog.access.toggle_vision_access')"
            >
                <font-awesome-icon icon="lightbulb" />
            </div>
            <div
                @click="removeOwner(owner.user)"
                :style="{ opacity: owned ? 1.0 : 0.3, textAlign: 'center', gridColumnStart: 'remove' }"
                :disabled="!owned"
                :title="t('game.ui.selection.edit_dialog.access.remove_owner_access')"
            >
                <font-awesome-icon icon="trash-alt" />
            </div>
        </template>
        <select id="dropdown" ref="accessDropdown" v-show="playersWithoutAccess.length > 0 && owned">
            <option v-for="player in playersWithoutAccess" :key="player.id" :disabled="!owned">
                {{ player.name }}
            </option>
        </select>
        <button id="button" @click="addOwner" v-show="playersWithoutAccess.length > 0 && owned">
            {{ t("game.ui.selection.edit_dialog.access.add_access") }}
        </button>
    </div>
</template>

<style scoped>
.owner {
    grid-column-start: name;
    margin-bottom: 5px;
    margin-left: 5px;
}

.panel {
    grid-template-columns: [name] 1fr [edit] 30px [move] 30px [vision] 30px [remove] 30px [end];
    grid-column-gap: 5px;
    align-items: center;
    padding-bottom: 1em;
}

#button {
    grid-column: edit/end;
    margin-top: 5px;
    /* min-width: 4vw; */
}

#dropdown {
    grid-column: name/edit;
    margin-top: 5px;
    min-width: 7vw;
}
</style>

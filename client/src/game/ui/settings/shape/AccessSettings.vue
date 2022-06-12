<script setup lang="ts">
import { computed, ref, toRef, watch } from "vue";
import { useI18n } from "vue-i18n";

import { SERVER_SYNC } from "../../../../core/models/types";
import type { PartialPick } from "../../../../core/types";
import { activeShapeStore } from "../../../../store/activeShape";
import { gameStore } from "../../../../store/game";
import { Role } from "../../../models/role";
import { accessSystem } from "../../../systems/access";
import { DEFAULT_ACCESS, DEFAULT_ACCESS_SYMBOL } from "../../../systems/access/models";
import type { ACCESS_KEY, ShapeAccess } from "../../../systems/access/models";

const { t } = useI18n();
defineProps<{ activeSelection: boolean }>();

watch(
    () => activeShapeStore.state.id,
    (newId, oldId) => {
        if (newId !== undefined && oldId !== newId) {
            accessSystem.loadState(newId);
        } else if (newId === undefined) {
            accessSystem.dropState();
        }
    },
    { immediate: true },
);

const accessDropdown = ref<HTMLSelectElement | null>(null);

const owned = accessSystem.$.hasEditAccess;
const defaultAccess = toRef(accessSystem.state, "defaultAccess");

const playersWithoutAccess = computed(() => {
    const id = accessSystem.state.id;
    if (id === undefined) return [];
    return gameStore.state.players.filter(
        (p) => p.role !== Role.DM && !accessSystem.$.owners.value.some((o) => o === p.name),
    );
});

function addOwner(): void {
    if (!owned.value || accessSystem.state.id === undefined) return;
    const dropdown = accessDropdown.value!;
    const selectedUser = dropdown.options[dropdown.selectedIndex].value;
    if (selectedUser === "") return;

    accessSystem.addAccess(
        accessSystem.state.id,
        selectedUser,
        { edit: true, movement: true, vision: true },
        SERVER_SYNC,
    );
}

function removeOwner(user: string): void {
    if (!owned.value || accessSystem.state.id === undefined) return;
    accessSystem.removeAccess(accessSystem.state.id, user, SERVER_SYNC);
}

function toggleEditAccess(user?: ACCESS_KEY): void {
    if (!owned.value || accessSystem.state.id === undefined) return;
    user ??= DEFAULT_ACCESS_SYMBOL;

    let oldAccess = DEFAULT_ACCESS;
    if (user === DEFAULT_ACCESS_SYMBOL) {
        oldAccess = accessSystem.getDefault(accessSystem.state.id) ?? oldAccess;
    } else {
        oldAccess = accessSystem.getAccess(accessSystem.state.id, user) ?? oldAccess;
    }
    const access: PartialPick<ShapeAccess, "edit"> = { edit: !oldAccess.edit };

    if (access.edit) {
        access.movement = true;
        access.vision = true;
    }
    accessSystem.updateAccess(accessSystem.state.id, user, access, SERVER_SYNC);
}

function toggleMovementAccess(user?: ACCESS_KEY): void {
    if (!owned.value || accessSystem.state.id === undefined) return;
    user ??= DEFAULT_ACCESS_SYMBOL;

    let oldAccess = DEFAULT_ACCESS;
    if (user === DEFAULT_ACCESS_SYMBOL) {
        oldAccess = accessSystem.getDefault(accessSystem.state.id) ?? oldAccess;
    } else {
        oldAccess = accessSystem.getAccess(accessSystem.state.id, user) ?? oldAccess;
    }
    const access: PartialPick<ShapeAccess, "movement"> = { movement: !oldAccess.movement };

    if (access.movement) {
        access.vision = true;
    } else {
        access.edit = false;
    }
    accessSystem.updateAccess(accessSystem.state.id, user, access, SERVER_SYNC);
}

function toggleVisionAccess(user?: ACCESS_KEY): void {
    if (!owned.value || accessSystem.state.id === undefined) return;
    user ??= DEFAULT_ACCESS_SYMBOL;

    let oldAccess = DEFAULT_ACCESS;
    if (user === DEFAULT_ACCESS_SYMBOL) {
        oldAccess = accessSystem.getDefault(accessSystem.state.id) ?? oldAccess;
    } else {
        oldAccess = accessSystem.getAccess(accessSystem.state.id, user) ?? oldAccess;
    }
    const access: PartialPick<ShapeAccess, "vision"> = { vision: !oldAccess.vision };

    if (!access.vision) {
        access.edit = false;
        access.movement = false;
    }
    accessSystem.updateAccess(accessSystem.state.id, user, access, SERVER_SYNC);
}
</script>

<template>
    <div class="panel restore-panel" v-show="activeSelection">
        <div class="spanrow header">{{ t("game.ui.selection.edit_dialog.access.access") }}</div>
        <div class="owner">
            <em>{{ t("game.ui.selection.edit_dialog.access.default") }}</em>
        </div>
        <div
            :style="{
                opacity: defaultAccess.edit ? 1.0 : 0.3,
                textAlign: 'center',
            }"
            :disabled="!owned"
            @click="toggleEditAccess()"
            :title="t('game.ui.selection.edit_dialog.access.toggle_edit_access')"
        >
            <font-awesome-icon icon="pencil-alt" />
        </div>
        <div
            :style="{ opacity: defaultAccess.movement ? 1.0 : 0.3, textAlign: 'center' }"
            :disabled="!owned"
            @click="toggleMovementAccess()"
            :title="t('game.ui.selection.edit_dialog.access.toggle_movement_access')"
        >
            <font-awesome-icon icon="arrows-alt" />
        </div>
        <div
            :style="{ opacity: defaultAccess.vision ? 1.0 : 0.3, textAlign: 'center' }"
            :disabled="!owned"
            @click="toggleVisionAccess()"
            :title="t('game.ui.selection.edit_dialog.access.toggle_vision_access')"
        >
            <font-awesome-icon icon="lightbulb" />
        </div>
        <template v-for="[user, access] of accessSystem.state.playerAccess" :key="user">
            <div class="owner">
                {{ user }}
            </div>
            <div
                :style="{
                    opacity: access.edit ? 1.0 : 0.3,
                    textAlign: 'center',
                }"
                :disabled="!owned"
                @click="toggleEditAccess(user)"
                :title="t('game.ui.selection.edit_dialog.access.toggle_edit_access')"
            >
                <font-awesome-icon icon="pencil-alt" />
            </div>
            <div
                :style="{ opacity: access.movement ? 1.0 : 0.3, textAlign: 'center' }"
                :disabled="!owned"
                @click="toggleMovementAccess(user)"
                :title="t('game.ui.selection.edit_dialog.access.toggle_movement_access')"
            >
                <font-awesome-icon icon="arrows-alt" />
            </div>
            <div
                :style="{ opacity: access.vision ? 1.0 : 0.3, textAlign: 'center' }"
                :disabled="!owned"
                @click="toggleVisionAccess(user)"
                :title="t('game.ui.selection.edit_dialog.access.toggle_vision_access')"
            >
                <font-awesome-icon icon="lightbulb" />
            </div>
            <div
                @click="removeOwner(user)"
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

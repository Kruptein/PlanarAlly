<script setup lang="ts">
import { computed, ref, toRef } from "vue";
import { useI18n } from "vue-i18n";

import { filter } from "../../../../core/iter";
import { SERVER_SYNC } from "../../../../core/models/types";
import type { PartialPick } from "../../../../core/types";
import { Role } from "../../../models/role";
import { accessSystem } from "../../../systems/access";
import { DEFAULT_ACCESS, DEFAULT_ACCESS_SYMBOL } from "../../../systems/access/models";
import type { ACCESS_KEY, AccessConfig } from "../../../systems/access/models";
import { accessState } from "../../../systems/access/state";
import { playerState } from "../../../systems/players/state";

const { t } = useI18n();

const accessDropdown = ref<HTMLSelectElement | null>(null);

const owned = accessState.hasEditAccess;
const defaultAccess = toRef(accessState.reactive, "defaultAccess");

const playersWithoutAccess = computed(() => {
    const id = accessState.reactive.id;
    if (id === undefined) return [];
    return [
        ...filter(
            playerState.reactive.players.values(),
            (p) => p.role !== Role.DM && !accessState.owners.value.some((o) => o === p.name),
        ),
    ];
});

function addOwner(): void {
    if (!owned.value || accessState.raw.id === undefined) return;
    const dropdown = accessDropdown.value!;
    const selectedUser = dropdown.options[dropdown.selectedIndex]?.value ?? "";
    if (selectedUser === "") return;

    accessSystem.addAccess(accessState.raw.id, selectedUser, { edit: true, movement: true, vision: true }, SERVER_SYNC);
}

function removeOwner(user: string): void {
    if (!owned.value || accessState.raw.id === undefined) return;
    accessSystem.removeAccess(accessState.raw.id, user, SERVER_SYNC);
}

function toggleEditAccess(user?: ACCESS_KEY): void {
    if (!owned.value || accessState.raw.id === undefined) return;
    user ??= DEFAULT_ACCESS_SYMBOL;

    let oldAccess = DEFAULT_ACCESS;
    if (user === DEFAULT_ACCESS_SYMBOL) {
        oldAccess = accessSystem.getDefault(accessState.raw.id);
    } else {
        oldAccess = accessSystem.getAccess(accessState.raw.id, user) ?? oldAccess;
    }
    const access: PartialPick<AccessConfig, "edit"> = { edit: !oldAccess.edit };

    if (access.edit) {
        access.movement = true;
        access.vision = true;
    }
    accessSystem.updateAccess(accessState.raw.id, user, access, SERVER_SYNC);
}

function toggleMovementAccess(user?: ACCESS_KEY): void {
    if (!owned.value || accessState.raw.id === undefined) return;
    user ??= DEFAULT_ACCESS_SYMBOL;

    let oldAccess = DEFAULT_ACCESS;
    if (user === DEFAULT_ACCESS_SYMBOL) {
        oldAccess = accessSystem.getDefault(accessState.raw.id);
    } else {
        oldAccess = accessSystem.getAccess(accessState.raw.id, user) ?? oldAccess;
    }
    const access: PartialPick<AccessConfig, "movement"> = { movement: !oldAccess.movement };

    if (access.movement) {
        access.vision = true;
    } else {
        access.edit = false;
    }
    accessSystem.updateAccess(accessState.raw.id, user, access, SERVER_SYNC);
}

function toggleVisionAccess(user?: ACCESS_KEY): void {
    if (!owned.value || accessState.raw.id === undefined) return;
    user ??= DEFAULT_ACCESS_SYMBOL;

    let oldAccess = DEFAULT_ACCESS;
    if (user === DEFAULT_ACCESS_SYMBOL) {
        oldAccess = accessSystem.getDefault(accessState.raw.id);
    } else {
        oldAccess = accessSystem.getAccess(accessState.raw.id, user) ?? oldAccess;
    }
    const access: PartialPick<AccessConfig, "vision"> = { vision: !oldAccess.vision };

    if (!access.vision) {
        access.edit = false;
        access.movement = false;
    }
    accessSystem.updateAccess(accessState.raw.id, user, access, SERVER_SYNC);
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
                opacity: defaultAccess.edit ? 1.0 : 0.3,
                textAlign: 'center',
            }"
            :disabled="!owned"
            :title="t('game.ui.selection.edit_dialog.access.toggle_edit_access')"
            @click="toggleEditAccess()"
        >
            <font-awesome-icon icon="pencil-alt" />
        </div>
        <div
            :style="{ opacity: defaultAccess.movement ? 1.0 : 0.3, textAlign: 'center' }"
            :disabled="!owned"
            :title="t('game.ui.selection.edit_dialog.access.toggle_movement_access')"
            @click="toggleMovementAccess()"
        >
            <font-awesome-icon icon="arrows-alt" />
        </div>
        <div
            :style="{ opacity: defaultAccess.vision ? 1.0 : 0.3, textAlign: 'center' }"
            :disabled="!owned"
            :title="t('game.ui.selection.edit_dialog.access.toggle_vision_access')"
            @click="toggleVisionAccess()"
        >
            <font-awesome-icon icon="lightbulb" />
        </div>
        <template v-for="[user, access] of accessState.reactive.playerAccess" :key="user">
            <div class="owner">
                {{ user }}
            </div>
            <div
                :style="{
                    opacity: access.edit ? 1.0 : 0.3,
                    textAlign: 'center',
                }"
                :disabled="!owned"
                :title="t('game.ui.selection.edit_dialog.access.toggle_edit_access')"
                @click="toggleEditAccess(user)"
            >
                <font-awesome-icon icon="pencil-alt" />
            </div>
            <div
                :style="{ opacity: access.movement ? 1.0 : 0.3, textAlign: 'center' }"
                :disabled="!owned"
                :title="t('game.ui.selection.edit_dialog.access.toggle_movement_access')"
                @click="toggleMovementAccess(user)"
            >
                <font-awesome-icon icon="arrows-alt" />
            </div>
            <div
                :style="{ opacity: access.vision ? 1.0 : 0.3, textAlign: 'center' }"
                :disabled="!owned"
                :title="t('game.ui.selection.edit_dialog.access.toggle_vision_access')"
                @click="toggleVisionAccess(user)"
            >
                <font-awesome-icon icon="lightbulb" />
            </div>
            <div
                :style="{ opacity: owned ? 1.0 : 0.3, textAlign: 'center', gridColumnStart: 'remove' }"
                :disabled="!owned"
                :title="t('game.ui.selection.edit_dialog.access.remove_owner_access')"
                @click="removeOwner(user)"
            >
                <font-awesome-icon icon="trash-alt" />
            </div>
        </template>
        <select v-show="playersWithoutAccess.length > 0 && owned" id="dropdown" ref="accessDropdown">
            <option v-for="player in playersWithoutAccess" :key="player.id" :disabled="!owned">
                {{ player.name }}
            </option>
        </select>
        <button v-show="playersWithoutAccess.length > 0 && owned" id="button" @click="addOwner">
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

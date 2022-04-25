<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { DeepReadonly } from "vue";
import { useI18n } from "vue-i18n";

import { SyncTo } from "../../../../core/models/types";
import { useModal } from "../../../../core/plugins/modals/plugin";
import { activeShapeStore } from "../../../../store/activeShape";
import { locationStore } from "../../../../store/location";
import { requestSpawnInfo } from "../../../api/emits/location";
import type { GlobalId } from "../../../id";
import { doorSystem } from "../../../systems/logic/door";
import { DEFAULT_PERMISSIONS } from "../../../systems/logic/models";
import type { LOGIC_TYPES, Permissions } from "../../../systems/logic/models";
import { teleportZoneSystem } from "../../../systems/logic/tp";

import LogicPermissions from "./LogicPermissions.vue";

const { t } = useI18n();
const modals = useModal();
const props = defineProps<{ activeSelection: boolean }>();

watch(
    [() => activeShapeStore.state.id, () => props.activeSelection],
    ([newId, newSelection], [oldId, oldSelection]) => {
        if (newSelection && newId !== undefined && (!(oldSelection ?? false) || oldId !== newId)) {
            doorSystem.loadState(newId);
            teleportZoneSystem.loadState(newId);
        } else if ((!newSelection && (oldSelection ?? false)) || newId === undefined) {
            doorSystem.dropState();
            teleportZoneSystem.dropState();
        }
    },
    { immediate: true },
);

const showPermissions = ref(false);
const activeLogic = ref<LOGIC_TYPES>("door");

const activePermissions = computed(() => {
    let permissions: DeepReadonly<Permissions> | undefined;
    if (activeLogic.value === "door") {
        permissions = doorSystem.state.permissions;
    } else {
        permissions = teleportZoneSystem.state.permissions;
    }
    return permissions ?? DEFAULT_PERMISSIONS();
});

function openPermissions(target: LOGIC_TYPES): void {
    activeLogic.value = target;
    showPermissions.value = true;
}

function setPermissions(permissions: Permissions): void {
    if (activeLogic.value === "door") {
        if (doorSystem.state.id === undefined) return;
        doorSystem.setPermissions(doorSystem.state.id, permissions, SyncTo.SERVER);
    } else {
        if (teleportZoneSystem.state.id === undefined) return;
        teleportZoneSystem.setPermissions(teleportZoneSystem.state.id, permissions, SyncTo.SERVER);
    }
}

// Door

function toggleDoor(): void {
    if (doorSystem.state.id === undefined) return;
    doorSystem.toggle(doorSystem.state.id, !doorSystem.state.enabled, SyncTo.SERVER);
}

// Teleport Zone

function toggleTeleportZone(): void {
    if (teleportZoneSystem.state.id === undefined) return;
    teleportZoneSystem.toggle(teleportZoneSystem.state.id, !teleportZoneSystem.state.enabled, SyncTo.SERVER);
}

function toggleTpImmediate(): void {
    if (teleportZoneSystem.state.id === undefined) return;
    teleportZoneSystem.toggleImmediate(teleportZoneSystem.state.id, !teleportZoneSystem.state.immediate, SyncTo.SERVER);
}

async function chooseTarget(): Promise<void> {
    if (teleportZoneSystem.state.id === undefined) return;

    // Select location
    const locations = locationStore.activeLocations.value;
    const choices = await modals.selectionBox(
        "Select target location",
        locations.map((l) => l.name),
    );
    if (choices === undefined) return;

    // Select spawn point

    const location = locations.find((l) => l.name === choices[0])!.id;
    const spawnInfo = await requestSpawnInfo(location);
    let targetLocation: { id: number; spawnUuid: GlobalId };

    switch (spawnInfo.length) {
        case 0:
            await modals.confirm(
                t("game.ui.selection.ShapeContext.no_spawn_set_title"),
                t("game.ui.selection.ShapeContext.no_spawn_set_text"),
                { showNo: false, yes: "Ok" },
            );
            return;
        case 1:
            targetLocation = { id: location, spawnUuid: spawnInfo[0].uuid };
            break;
        default: {
            const choice = await modals.selectionBox(
                "Choose the desired teleport target",
                spawnInfo.map((s) => s.name),
            );
            if (choice === undefined) return;
            const choiceShape = spawnInfo.find((s) => s.name === choice[0]);
            if (choiceShape === undefined) return;
            targetLocation = { id: location, spawnUuid: choiceShape.uuid };
            break;
        }
    }

    // Save tp zone info

    teleportZoneSystem.setTarget(teleportZoneSystem.state.id, targetLocation, SyncTo.SERVER);
}
</script>

<template>
    <div class="panel restore-panel" v-show="activeSelection">
        <teleport to="#teleport-modals">
            <LogicPermissions
                v-model:visible="showPermissions"
                :permissions="activePermissions"
                @update:permissions="setPermissions"
            />
        </teleport>
        <div class="spanrow header">Door</div>
        <label for="logic-dialog-door-toggle">Enabled</label>
        <input
            id="logic-dialog-door-toggle"
            type="checkbox"
            class="styled-checkbox center"
            :checked="doorSystem.state.enabled"
            @click="toggleDoor"
        />
        <label for="logic-dialog-door-config">Permissions</label>
        <button id="logic-dialog-door-config" class="center" @click="openPermissions('door')">
            <font-awesome-icon icon="cog" />
        </button>
        <div class="spanrow header">Teleport Zone</div>
        <label for="logic-dialog-tp-toggle">Enabled</label>
        <input
            id="logic-dialog-tp-toggle"
            type="checkbox"
            class="styled-checkbox center"
            :checked="teleportZoneSystem.state.enabled"
            @click="toggleTeleportZone"
        />
        <label for="logic-dialog-tp-config">Permissions</label>
        <button id="logic-dialog-tp-config" class="center" @click="openPermissions('tp')">
            <font-awesome-icon icon="cog" />
        </button>
        <label for="logic-dialog-tp-target">Target</label>
        <button id="logic-dialog-tp-target" class="center" @click="chooseTarget">
            <font-awesome-icon icon="cog" />
        </button>
        <label for="logic-dialog-tp-toggle">Immediate mode</label>
        <input
            id="logic-dialog-tp-toggle"
            type="checkbox"
            class="styled-checkbox center"
            :checked="teleportZoneSystem.state.immediate"
            @click="toggleTpImmediate"
        />
    </div>
</template>

<style lang="scss" scoped>
.panel {
    grid-template-columns: [name] 1fr [toggle] 100px [end];
    grid-column-gap: 5px;
    align-items: center;
    padding-bottom: 1em;

    min-width: 300px;

    button {
        width: 30px;
        display: grid;
        place-content: center;
    }

    .center {
        justify-self: center;
    }
}
</style>

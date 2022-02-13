<script setup lang="ts">
import { computed, ref, watchEffect } from "vue";
// import { useI18n } from "vue-i18n";

import { SyncTo } from "../../../../core/models/types";
import { useModal } from "../../../../core/plugins/modals/plugin";
import { activeShapeStore } from "../../../../store/activeShape";
import { locationStore } from "../../../../store/location";
// import { requestSpawnInfo } from "../../../api/emits/location";
// import type { GlobalId } from "../../../id";
import { reactiveLogic } from "../../../systems/logic/active";
import { DEFAULT_PERMISSIONS } from "../../../systems/logic/models";
import type { LOGIC_TYPES, Permissions } from "../../../systems/logic/models";

import LogicPermissions from "./LogicPermissions.vue";

// const { t } = useI18n();
const modals = useModal();
const props = defineProps<{ activeSelection: boolean }>();

watchEffect(() => {
    if (activeShapeStore.state.id !== undefined && props.activeSelection) {
        reactiveLogic.load(activeShapeStore.state.id);
    } else {
        reactiveLogic.reset();
    }
});

const showPermissions = ref(false);
const activeLogic = ref<LOGIC_TYPES>("door");

const activePermissions = computed(() => {
    if (activeLogic.value === "door") {
        return reactiveLogic.state.door.permissions ?? DEFAULT_PERMISSIONS;
    } else {
        return reactiveLogic.state.tp.permissions ?? DEFAULT_PERMISSIONS;
    }
});

function openPermissions(target: LOGIC_TYPES): void {
    activeLogic.value = target;
    showPermissions.value = true;
}

function setPermissions(permissions: Permissions): void {
    if (activeLogic.value === "door") {
        reactiveLogic.setDoorPermissions(permissions, SyncTo.SERVER);
    } else {
        // activeShapeStore.setOptionKey(
        //     "teleport",
        //     {
        //         conditions: permissions,
        //         location: activeShapeStore.state.options?.teleport?.location,
        //         immediate: activeShapeStore.state.options?.teleport?.immediate ?? false,
        //     },
        //     SyncTo.SERVER,
        // );
    }
}

// Door

function toggleDoor(): void {
    reactiveLogic.setIsDoor(!reactiveLogic.isDoor, SyncTo.SERVER);
}

// Teleport Zone

function toggleTeleportZone(): void {
    reactiveLogic.setIsTeleportZone(!reactiveLogic.isTeleportZone, SyncTo.SERVER);
}

function toggleTpImmediate(): void {
    // const oldTp = activeShapeStore.state.options?.teleport;
    // activeShapeStore.setOptionKey(
    //     "teleport",
    //     {
    //         conditions: oldTp?.conditions === undefined ? DEFAULT_CONDITIONS : copyConditions(oldTp.conditions),
    //         location: oldTp?.location,
    //         immediate: !(oldTp?.immediate ?? false),
    //     },
    //     SyncTo.SERVER,
    // );
}

async function chooseTarget(): Promise<void> {
    // Select location
    const locations = locationStore.activeLocations.value;
    const choices = await modals.selectionBox(
        "Select target location",
        locations.map((l) => l.name),
    );
    if (choices === undefined) return;

    // Select spawn point

    // const location = locations.find((l) => l.name === choices[0])!.id;
    // const spawnInfo = await requestSpawnInfo(location);
    // let targetLocation: { id: number; spawnUuid: GlobalId };

    // switch (spawnInfo.length) {
    //     case 0:
    //         await modals.confirm(
    //             t("game.ui.selection.ShapeContext.no_spawn_set_title"),
    //             t("game.ui.selection.ShapeContext.no_spawn_set_text"),
    //             { showNo: false, yes: "Ok" },
    //         );
    //         return;
    //     case 1:
    //         targetLocation = { id: location, spawnUuid: spawnInfo[0].uuid };
    //         break;
    //     default: {
    //         const choice = await modals.selectionBox(
    //             "Choose the desired teleport target",
    //             spawnInfo.map((s) => s.name),
    //         );
    //         if (choice === undefined) return;
    //         const choiceShape = spawnInfo.find((s) => s.name === choice[0]);
    //         if (choiceShape === undefined) return;
    //         targetLocation = { id: location, spawnUuid: choiceShape.uuid };
    //         break;
    //     }
    // }

    // Save tp zone info

    // const oldConditions = activeShapeStore.state.options?.teleport?.conditions;
    // activeShapeStore.setOptionKey(
    //     "teleport",
    //     {
    //         conditions: oldConditions === undefined ? DEFAULT_PERMISSIONS : copyConditions(oldConditions),
    //         location: targetLocation,
    //         immediate: activeShapeStore.state.options?.teleport?.immediate ?? false,
    //     },
    //     SyncTo.SERVER,
    // );
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
            :checked="reactiveLogic.state.door.enabled"
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
            :checked="true"
            @click="toggleTeleportZone"
        />
        <label for="logic-dialog-tp-config">Conditions</label>
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
            :checked="activeShapeStore.state.options?.teleport?.immediate === true"
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

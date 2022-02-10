<script setup lang="ts">
import { computed, ref, toRef } from "vue";
import { useI18n } from "vue-i18n";

import { SyncTo } from "../../../../core/models/types";
import { useModal } from "../../../../core/plugins/modals/plugin";
import { activeShapeStore } from "../../../../store/activeShape";
import { locationStore } from "../../../../store/location";
import { copyConditions } from "../../../../store/logic";
import { requestSpawnInfo } from "../../../api/emits/location";
import { DEFAULT_CONDITIONS } from "../../../models/logic";
import type { Conditions, LOGIC_TYPES } from "../../../models/logic";
import type { GlobalId } from "../../../shapes/localId";

import LogicPermissions from "./LogicPermissions.vue";

const { t } = useI18n();
const modals = useModal();

const showConditions = ref(false);
const activeLogic = ref<LOGIC_TYPES>("door");

const options = toRef(activeShapeStore.state, "options");

const activeConditions = computed(() => {
    if (activeLogic.value === "door") {
        return options.value?.doorConditions ?? DEFAULT_CONDITIONS;
    } else {
        return options.value?.teleport?.conditions ?? DEFAULT_CONDITIONS;
    }
});

function openConditions(target: LOGIC_TYPES): void {
    activeLogic.value = target;
    showConditions.value = true;
}

function setConditions(conditions: Conditions): void {
    if (activeLogic.value === "door") {
        activeShapeStore.setOptionKey("doorConditions", conditions, SyncTo.SERVER);
    } else {
        activeShapeStore.setOptionKey(
            "teleport",
            {
                conditions,
                location: activeShapeStore.state.options?.teleport?.location,
                immediate: activeShapeStore.state.options?.teleport?.immediate ?? false,
            },
            SyncTo.SERVER,
        );
    }
}

// Door

function toggleDoor(): void {
    activeShapeStore.setIsDoor(!activeShapeStore.state.isDoor, SyncTo.SERVER);
}

// Teleport Zone

function toggleTeleportZone(): void {
    activeShapeStore.setIsTeleportZone(!activeShapeStore.state.isTeleportZone, SyncTo.SERVER);
}

function toggleTpImmediate(): void {
    const oldTp = activeShapeStore.state.options?.teleport;
    activeShapeStore.setOptionKey(
        "teleport",
        {
            conditions: oldTp?.conditions === undefined ? DEFAULT_CONDITIONS : copyConditions(oldTp.conditions),
            location: oldTp?.location,
            immediate: !(oldTp?.immediate ?? false),
        },
        SyncTo.SERVER,
    );
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

    const oldConditions = activeShapeStore.state.options?.teleport?.conditions;
    activeShapeStore.setOptionKey(
        "teleport",
        {
            conditions: oldConditions === undefined ? DEFAULT_CONDITIONS : copyConditions(oldConditions),
            location: targetLocation,
            immediate: activeShapeStore.state.options?.teleport?.immediate ?? false,
        },
        SyncTo.SERVER,
    );
}
</script>

<template>
    <div class="panel restore-panel">
        <teleport to="#teleport-modals">
            <LogicPermissions
                v-model:visible="showConditions"
                :conditions="activeConditions"
                @update:conditions="setConditions"
            />
        </teleport>
        <div class="spanrow header">Door</div>
        <label for="logic-dialog-door-toggle">Enabled</label>
        <input
            id="logic-dialog-door-toggle"
            type="checkbox"
            class="styled-checkbox center"
            :checked="activeShapeStore.state.isDoor"
            @click="toggleDoor"
        />
        <label for="logic-dialog-door-config">Conditions</label>
        <button id="logic-dialog-door-config" class="center" @click="openConditions('door')">
            <font-awesome-icon icon="cog" />
        </button>
        <div class="spanrow header">Teleport Zone</div>
        <label for="logic-dialog-tp-toggle">Enabled</label>
        <input
            id="logic-dialog-tp-toggle"
            type="checkbox"
            class="styled-checkbox center"
            :checked="activeShapeStore.state.isTeleportZone"
            @click="toggleTeleportZone"
        />
        <label for="logic-dialog-tp-config">Conditions</label>
        <button id="logic-dialog-tp-config" class="center" @click="openConditions('tp')">
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

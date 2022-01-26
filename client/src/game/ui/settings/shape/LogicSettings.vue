<script setup lang="ts">
import { ref, toRef } from "vue";

import { SyncTo } from "../../../../core/models/types";
import { activeShapeStore } from "../../../../store/activeShape";
import type { Conditions } from "../../../models/logic";

import LogicPermissions from "./LogicPermissions.vue";

const showConditions = ref(false);

const options = toRef(activeShapeStore.state, "options");

function toggleDoor(): void {
    activeShapeStore.setIsDoor(!activeShapeStore.state.isDoor, SyncTo.SERVER);
}

function setDoorConditions(conditions: Conditions): void {
    activeShapeStore.setOptionKey("doorConditions", conditions, SyncTo.SERVER);
}

function openConditions(): void {
    if (activeShapeStore.state.isDoor) showConditions.value = true;
}
</script>

<template>
    <div class="panel restore-panel">
        <teleport to="#teleport-modals" v-if="activeShapeStore.state.isDoor">
            <LogicPermissions
                v-model:visible="showConditions"
                :conditions="options!.doorConditions!"
                @change="setDoorConditions"
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
        <button
            id="logic-dialog-door-config"
            class="center"
            @click="openConditions"
            :disabled="!activeShapeStore.state.isDoor"
        >
            <font-awesome-icon icon="cog" />
        </button>
    </div>
</template>

<style lang="scss" scoped>
.panel {
    grid-template-columns: [name] 1fr [toggle] 60px [end];
    grid-column-gap: 5px;
    align-items: center;
    padding-bottom: 1em;

    button {
        width: 10px;
        display: grid;
        place-content: center;
    }

    .center {
        justify-self: center;
    }
}

.spanrow + .condition-panel {
    display: grid;
    grid-template-columns: [enabled] 60px [request] 60px [disabled] 60px [end];
    grid-column-gap: 5px;
    align-items: start;
    justify-content: space-around;
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

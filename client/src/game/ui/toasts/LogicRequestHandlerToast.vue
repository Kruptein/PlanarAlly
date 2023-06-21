<script lang="ts" setup>
import { computed } from "vue";

import type { LogicDoorRequest, LogicRequestInfo, LogicTeleportRequest } from "../../../apiTypes";
import { sendDeclineRequest } from "../../api/emits/logic";
import { getLocalId, getShapeFromGlobal } from "../../id";
import { setCenterPosition } from "../../position";
import { floorSystem } from "../../systems/floors";
import { doorSystem } from "../../systems/logic/door";
import { teleport } from "../../systems/logic/tp/core";
import { playerSystem } from "../../systems/players";

const emit = defineEmits(["close-toast"]);
const props = defineProps<{ data: LogicRequestInfo }>();

const player = computed(() => playerSystem.getPlayer(props.data.requester));

const text = computed(
    () =>
        `${player.value?.name ?? "unknown player"} requests to use ${
            props.data.request.logic === "door" ? "door" : "teleport zone"
        }`,
);

function reject(): void {
    sendDeclineRequest(props.data.requester);
    emit("close-toast");
}

async function accept(): Promise<void> {
    if (props.data.request.logic === "door") {
        approveDoor(props.data.request);
    } else if (props.data.request.logic === "tp") {
        await approveTp(props.data.request);
    }
    emit("close-toast");
}

function approveDoor(request: LogicDoorRequest): void {
    const shape = getLocalId(request.door);
    if (shape === undefined) return;
    doorSystem.toggleDoor(shape);
}

async function approveTp(request: LogicTeleportRequest): Promise<void> {
    const shape = getLocalId(request.fromZone);
    if (shape === undefined) return;
    await teleport(
        shape,
        request.toZone,
        request.transfers.map((t) => getLocalId(t)!),
    );
}

function showArea(): void {
    const uuid = props.data.request.logic === "door" ? props.data.request.door : props.data.request.fromZone;
    const shape = getShapeFromGlobal(uuid);
    if (shape?.floorId === undefined) return;

    shape.showHighlight = true;
    setCenterPosition(shape.center);
    floorSystem.selectFloor({ id: shape.floorId }, true);
}
</script>

<template>
    <div class="toast-container">
        <span>{{ text }}</span>
        <div class="actions">
            <font-awesome-icon icon="eye" class="action" title="view area" @click="showArea" />
            <font-awesome-icon icon="check-circle" class="action" title="accept" @click="accept" />
            <font-awesome-icon icon="times-circle" class="action" title="reject" @click="reject" />
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import "vue-toastification/src/scss/_variables";

.toast-container {
    display: grid;
    grid-template-columns: 1fr auto;
    column-gap: 25px;
    align-items: center;

    .actions {
        display: grid;
        grid-template-columns: repeat(3, auto);
        column-gap: 5px;

        .action {
            padding: 5px;
            background-color: white;
            color: $vt-color-info;
            border-radius: 7px;

            &:hover {
                cursor: pointer;
                font-weight: bold;
            }
        }
    }
}
</style>

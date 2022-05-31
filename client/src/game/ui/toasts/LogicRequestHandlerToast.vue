<script lang="ts" setup>
import { computed } from "vue";

import { sendDeclineRequest } from "../../api/emits/logic";
import { getLocalId, getShapeFromGlobal } from "../../id";
import type { Global } from "../../id";
import { setCenterPosition } from "../../position";
import { doorSystem } from "../../systems/logic/door";
import type { DoorRequest } from "../../systems/logic/door/models";
import type { RequestTypeResponse } from "../../systems/logic/models";
import { teleport } from "../../systems/logic/tp";
import type { TpRequest } from "../../systems/logic/tp/models";

const emit = defineEmits(["close-toast"]);
const props = defineProps<{ data: RequestTypeResponse }>();

const text = computed(
    () => `${props.data.requester} requests to use ${props.data.logic === "door" ? "door" : "teleport zone"}`,
);

function reject(): void {
    sendDeclineRequest(props.data.requester);
    emit("close-toast");
}

function accept(): void {
    if (props.data.logic === "door") {
        approveDoor(props.data);
    } else if (props.data.logic === "tp") {
        approveTp(props.data);
    }
    emit("close-toast");
}

function approveDoor(request: Global<DoorRequest> & { requester: string }): void {
    const shape = getLocalId(request.door);
    if (shape === undefined) return;
    doorSystem.toggleDoor(shape);
}

function approveTp(request: Global<TpRequest> & { requester: string }): void {
    teleport(
        getLocalId(request.fromZone)!,
        request.toZone,
        request.transfers.map((t) => getLocalId(t)!),
    );
}

function showArea(): void {
    const uuid = props.data.logic === "door" ? props.data.door : props.data.toZone;
    const shape = getShapeFromGlobal(uuid);
    if (shape === undefined) return;

    shape.showHighlight = true;
    setCenterPosition(shape.center());
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

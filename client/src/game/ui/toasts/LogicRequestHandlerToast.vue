<script lang="ts" setup>
import { computed } from "vue";

import { SyncTo } from "../../../core/models/types";
import { logicStore } from "../../../store/logic";
import { IdMap, UuidToIdMap } from "../../../store/shapeMap";
import { sendDeclineRequest } from "../../api/emits/logic";
import type { DoorRequest, RequestTypeResponse, TpRequest } from "../../models/logic";
import { setCenterPosition } from "../../position";
import type { Global } from "../../shapes/localId";

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
    const shape = IdMap.get(UuidToIdMap.get(request.door)!);
    if (shape === undefined) return;

    shape.setBlocksVision(!shape.blocksVision, SyncTo.SERVER, true);
    shape.setBlocksMovement(!shape.blocksMovement, SyncTo.SERVER, true);
}

function approveTp(request: Global<TpRequest> & { requester: string }): void {
    logicStore.teleport(
        UuidToIdMap.get(request.fromZone)!,
        request.toZone,
        request.transfers.map((t) => UuidToIdMap.get(t)!),
    );
}

function showArea(): void {
    const uuid = props.data.logic === "door" ? props.data.door : props.data.toZone;
    const shape = IdMap.get(UuidToIdMap.get(uuid)!);
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

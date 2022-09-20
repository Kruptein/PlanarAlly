<script setup lang="ts">
import { activeShapeStore } from "../../../../store/activeShape";
import { sendShapeCanRotate } from "../../../api/emits/shape/options";
import { getGlobalId, getShape } from "../../../id";
import { accessState } from "../../../systems/access/state";

const owned = accessState.hasEditAccess;

function setRotate(event: Event): void {
    if (!owned.value) return;
    const canRotate = (event.target as HTMLInputElement).checked;
    const shape = getShape(activeShapeStore.state.id!)!;
    shape.options.canRotate = canRotate;
    sendShapeCanRotate({ shape: getGlobalId(shape.id), value: canRotate });
}
</script>

<template>
    <div class="panel restore-panel">
        <div class="spanrow header">Interaction</div>
        <div class="row">
            <label for="lg-settings-rotate">Can rotate?</label>
            <input
                type="checkbox"
                id="shapeselectiondialog-istoken"
                :checked="activeShapeStore.state.options?.canRotate ?? false"
                @click="setRotate"
                style="grid-column-start: toggle"
                class="styled-checkbox"
                :disabled="!owned"
            />
        </div>
    </div>
</template>

<style scoped>
.panel {
    grid-template-columns: [label] 1fr [name] 2fr [toggle] 30px [end];
    grid-column-gap: 5px;
    align-items: center;
    padding-bottom: 1em;
    justify-items: center;
}

label {
    justify-self: normal;
}

/* Reset PanelModal 100% style */
input[type="text"] {
    width: auto;
}

input[type="checkbox"] {
    width: 16px;
    height: 23px;
    margin: 0 8px 0 8px;
    white-space: nowrap;
    display: inline-block;
}
</style>

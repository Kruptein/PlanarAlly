<script setup lang="ts">
import { nextTick, ref, watchEffect } from "vue";

import Modal from "./Modal.vue";

const props = defineProps<{
    visible: boolean;
    yes: string;
    no: string;
    showNo: boolean;
    title: string;
    text: string;
    focus: string;
}>();
const emit = defineEmits(["close", "submit"]);

const confirm = ref<HTMLButtonElement | null>(null);
const deny = ref<HTMLButtonElement | null>(null);

watchEffect(() => {
    if (props.visible) {
        nextTick(() => {
            if (props.focus === "confirm") confirm.value!.focus();
            else deny.value!.focus();
        });
    }
});
</script>

<template>
    <modal :visible="visible" @close="emit('close')">
        <template v-slot:header="m">
            <div class="modal-header" draggable="true" @dragstart="m.dragStart" @dragend="m.dragEnd">
                {{ title }}
            </div>
        </template>
        <div class="modal-body">
            <slot>{{ text }}</slot>
            <div class="buttons">
                <button @click="emit('submit', true)" ref="confirm" :class="{ focus: focus === 'confirm' }">
                    {{ yes }}
                </button>
                <button @click="emit('submit', false)" v-if="showNo" ref="deny" :class="{ focus: focus === 'deny' }">
                    {{ no }}
                </button>
            </div>
        </div>
    </modal>
</template>

<style scoped>
.modal-header {
    background-color: #ff7052;
    padding: 10px;
    font-size: 20px;
    font-weight: bold;
    cursor: move;
}

.modal-body {
    max-width: 30vw;
    padding: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.buttons {
    align-self: flex-end;
    margin-top: 15px;
}

button:first-of-type {
    margin-right: 10px;
}

.focus {
    color: #7c253e;
    font-weight: bold;
}
</style>

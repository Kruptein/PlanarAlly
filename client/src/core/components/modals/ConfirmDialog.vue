<script lang="ts">
import { defineComponent, nextTick, ref, watchEffect } from "vue";

import Modal from "./Modal.vue";

export default defineComponent({
    name: "ConfirmDialog",
    components: { Modal },
    emits: ["close", "submit"],
    props: {
        visible: { type: Boolean, required: true },
        yes: { type: String, required: true },
        no: { type: String, required: true },
        showNo: { type: Boolean, required: true },
        title: { type: String, required: true },
        text: { type: String, required: true },
        focus: { type: String, required: true },
    },
    setup(props, { emit }) {
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

        return { confirm, deny, emit };
    },
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

<script setup lang="ts">
import { nextTick, ref, watch } from "vue";

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

watch(
    () => props.visible,
    async (visible) => {
        if (visible) {
            await nextTick(() => {
                if (props.focus === "confirm") confirm.value!.focus();
                else deny.value!.focus();
            });
        }
    },
);
</script>

<template>
    <modal :visible="visible" @close="emit('close')">
        <template #header="m">
            <div class="modal-header" draggable="true" @dragstart="m.dragStart" @dragend="m.dragEnd">
                {{ title }}
            </div>
        </template>
        <div class="modal-body">
            <slot>{{ text }}</slot>
            <div class="buttons">
                <button ref="confirm" :class="{ focus: focus === 'confirm' }" @click="emit('submit', true)">
                    {{ yes }}
                </button>
                <button v-if="showNo" ref="deny" :class="{ focus: focus === 'deny' }" @click="emit('submit', false)">
                    {{ no }}
                </button>
            </div>
        </div>
    </modal>
</template>

<style scoped lang="scss">
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

    .buttons {
        align-self: flex-end;
        margin-top: 15px;

        button:first-of-type {
            margin-right: 10px;
        }

        .focus {
            color: #7c253e;
            font-weight: bold;
        }
    }
}

@media (width: 2560px) and (height: 2560px) {
    .modal-header {
        font-size: calc(22px * 2560 / 1920);
    }

    .modal-body {
        font-size: calc(20px * 2560 / 1920);
        font-weight: normal;
    }

    button {
        font-size: calc(20px * 2560 / 1920);
        width: calc(60px * 2560 / 1920);
        height: calc(45px * 2560 / 1920);

        &:first-of-type {
            margin-right: calc(15px * 2560 / 1920);
        }
    }
}
</style>

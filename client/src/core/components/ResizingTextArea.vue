<script setup lang="ts">
import { nextTick, onMounted, useTemplateRef, watch } from "vue";

import { getTarget, getValue } from "../utils";

const props = withDefaults(
    defineProps<{
        disabled?: boolean;
        visible?: boolean;
    }>(),
    {
        disabled: false,
        visible: true,
    },
);

watch(
    () => props.visible,
    async (v) => {
        if (v) {
            // vue-tsc and eslint disagree on this assertion
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
            await nextTick(() => resizeTextArea(textArea.value!));
        }
    },
);

const textArea = useTemplateRef("textarea");

onMounted(async () => {
    await nextTick(() => {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        if (props.visible ?? true) resizeTextArea(textArea.value!);
    });
});

const emit = defineEmits<(e: "change", s: string) => void>();

const text = defineModel<string>({ required: true });

watch(
    () => text.value,
    async () => {
        if (props.visible) {
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
            await nextTick(() => resizeTextArea(textArea.value!));
        }
    },
);

function resizeTextArea(element: HTMLElement): void {
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
}
</script>

<template>
    <div class="counter-wrapper">
        <div class="grow-wrapper">
            <textarea
                ref="textarea"
                v-model="text"
                type="text"
                :disabled="props.disabled"
                rows="1"
                @input="resizeTextArea(getTarget($event))"
                @change="emit('change', getValue($event))"
                @keyup.enter="getTarget($event).blur()"
                @keydown.enter.prevent
            />
        </div>
    </div>
</template>

<style scoped lang="scss">
.grow-wrapper {
    display: flex;
    flex-grow: 1;
    width: 100%;
    > textarea {
        flex-grow: 1;
        width: 100%;
        min-height: 1.5em;
        height: auto;
        border: none;
        resize: none;
        font-family: inherit;
        font-size: 11pt;
        overflow: hidden;
        white-space: pre-wrap;
        word-wrap: break-word;
        background: rgb(1, 1, 1, 0);
        border-radius: 0.25em;
        text-align: right;
        padding: 0;
        margin: 0;
    }
}
</style>

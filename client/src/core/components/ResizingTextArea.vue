<script setup lang="ts">
import { nextTick, onMounted, useTemplateRef, watch } from "vue";

import { getTarget, getValue } from "../utils";

const { visible = true, disabled = false } = defineProps<{ visible?: boolean; disabled?: boolean }>();
const textArea = useTemplateRef("textarea");
const emit = defineEmits<(e: "change", s: string) => void>();
const text = defineModel<string>({ required: true });

onMounted(async () => {
    await nextTick(() => {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        if (visible ?? true) resizeTextArea(textArea.value!);
    });
});

watch([() => visible, () => text.value], async () => {
    if (visible) {
        // vue-tsc and eslint disagree on this assertion
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        await nextTick(() => resizeTextArea(textArea.value!));
    }
});

function resizeTextArea(element: HTMLElement): void {
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
}
</script>

<template>
    <div class="grow-wrapper">
        <textarea
            ref="textarea"
            v-model="text"
            type="text"
            :disabled="disabled"
            rows="1"
            @input="resizeTextArea(getTarget($event))"
            @change="emit('change', getValue($event))"
            @keyup.enter="getTarget($event).blur()"
            @keydown.enter.prevent
        />
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

<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from "vue";
import type { StyleValue } from "vue";

import SliderDot from "./SliderDot.vue";
import { getPosByEvent } from "./utils";

const props = withDefaults(
    defineProps<{
        height?: string;
        width?: string;
        dotSize?: [number, number];
        dotStyle?: StyleValue;
        railStyle?: StyleValue;
        min?: number;
        max?: number;
        interval?: number;
        modelValue: number;
    }>(),
    { height: "auto", width: "auto", dotSize: () => [14, 14], min: 0, max: 100, interval: 1 },
);
const emit = defineEmits(["update:modelValue", "change"]);

const rail = ref<HTMLDivElement | null>(null);
const dotPos = ref(0);
const dragging = ref(false);
const focussed = ref(false);

const scale = ref(1);

onMounted(() => {
    scale.value = Math.floor(rail.value?.offsetWidth ?? 100) / 100;
});

const value = computed(() => {
    return props.min + (props.max - props.min) * (dotPos.value / (100 * scale.value));
});

watchEffect(() => {
    if (value.value !== props.modelValue) {
        dotPos.value = (100 * scale.value * (props.modelValue - props.min)) / (props.max - props.min);
    }
});

function onClick(e: MouseEvent | TouchEvent): void {
    const pos = getPosByEvent(e, rail.value!);
    setValueByPos(pos.x);
    emit("update:modelValue", value.value);
}

function dragMove(e: MouseEvent | TouchEvent): void {
    if (!dragging.value) return;
    const pos = getPosByEvent(e, rail.value!);
    setValueByPos(pos.x);
    emit("change", value.value);
}

function setValueByPos(pos: number): void {
    if (pos === dotPos.value) return;
    dotPos.value = pos;
}
</script>

<template>
    <div
        class="vue-slider"
        :style="{ width, height, padding: `${dotSize[1] / scale}px 0` }"
        @click="onClick"
        @mousedown="dragging = true"
        @mousemove="dragMove"
        @mouseup="dragging = false"
        @focusin="focussed = true"
        @blur="focussed = false"
        tabindex="0"
    >
        <div ref="rail" class="vue-slider-rail" :style="railStyle">
            <SliderDot
                :dotStyle="dotStyle"
                :dotSize="dotSize"
                :position="dotPos / 2"
                :value="value"
                :style="{ transition: dragging ? 'none' : undefined }"
                :focussed="focussed"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
$bgColor: #ccc !default;
$railBorderRadius: 15px !default;

.vue-slider {
    position: relative;
    box-sizing: content-box;
    user-select: none;
    display: block;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
}

.vue-slider-rail {
    position: relative;
    width: 100%;
    height: 100%;
    transition-property: width, height, left, right, top, bottom;

    background-color: $bgColor;
    border-radius: $railBorderRadius;

    &:hover {
        cursor: pointer;
    }
}
</style>

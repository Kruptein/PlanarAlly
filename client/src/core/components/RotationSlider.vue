<script setup lang="ts">
import { computed, ref, watchEffect } from "vue";

import { toDegrees, toRadians } from "../conversions";

const props = withDefaults(
    defineProps<{
        angle: number;
        showNumberInput?: boolean;
        disabled: boolean;
    }>(),
    { showNumberInput: false },
);
const emit = defineEmits<(e: "change" | "input", angle: number) => void>();

const circle = ref<HTMLDivElement | null>(null);

let active = false;
const radius = 8; // circle is 20px - 2px border diameter -> 8px radius
const radianAngle = ref(0);

const degreeAngle = computed({
    get(): number {
        return Math.round(toDegrees(radianAngle.value));
    },
    set(angle: number) {
        radianAngle.value = toRadians(angle);
        emit("input", Math.round(angle));
    },
});

const left = computed(() => Math.round(radius * Math.cos(radianAngle.value)) + radius / 2);
const top = computed(() => Math.round(radius * Math.sin(radianAngle.value)) + radius / 2);

watchEffect(() => {
    radianAngle.value = toRadians(props.angle);
});

function mouseDown(): void {
    if (props.disabled) return;
    active = true;
}

function mouseUp(): void {
    if (active) {
        emit("change", Math.round(toDegrees(radianAngle.value)));
    }
    active = false;
}

function syncDegreeAngle(): void {
    emit("change", Math.round(toDegrees(radianAngle.value)));
}

function mouseMove(event: MouseEvent): void {
    if (active) {
        const circleRect = circle.value!.getBoundingClientRect();
        const center = { x: circleRect.left + circleRect.width / 2, y: circleRect.top + circleRect.height / 2 };

        const mPos = { x: event.x - center.x, y: event.y - center.y };
        radianAngle.value = Math.PI / 2 - Math.atan2(radius * mPos.x, radius * mPos.y);

        emit("input", Math.round(toDegrees(radianAngle.value)));
    }
}
</script>

<template>
    <div class="rotational-slider" :class="{ withNumber: showNumberInput }">
        <div
            ref="circle"
            class="circle"
            @mousedown="mouseDown"
            @mouseup="mouseUp"
            @mousemove="mouseMove"
            @mouseleave="mouseUp"
        >
            <div class="slider" :style="{ left: `${left}px`, top: `${top}px` }"></div>
        </div>
        <div v-if="showNumberInput">
            <input
                v-model.number="degreeAngle"
                type="text"
                inputmode="numeric"
                :disabled="disabled"
                @change="syncDegreeAngle"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
.rotational-slider {
    display: flex;
    justify-content: space-between;
    align-items: center;

    &.withNumber {
        width: 75px;
    }

    input[type="text"] {
        width: 40px;
    }

    .circle {
        width: 20px;
        height: 20px;
        border: 2px solid gray;
        border-radius: 100%;

        .slider {
            position: relative;
            height: 10px;
            width: 10px;
            background: gray;
            border-radius: 100%;
            cursor: pointer;
        }
    }
}
</style>

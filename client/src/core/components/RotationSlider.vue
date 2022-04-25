<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { toDegrees, toRadians } from "../conversions";

const props = withDefaults(
    defineProps<{
        angle: number;
        showNumberInput?: boolean;
    }>(),
    { showNumberInput: false },
);
const emit = defineEmits<{ (e: "input", angle: number): void; (e: "change", angle: number): void }>();

const circle = ref<HTMLDivElement | null>(null);

let active = false;
const radius = 10;
const radianAngle = ref(0);

const degreeAngle = computed({
    get(): number {
        return Math.round(toDegrees(radianAngle.value));
    },
    set(angle: number) {
        radianAngle.value = toRadians(angle);
        emit("input", angle);
    },
});

const left = computed(() => Math.round(radius * Math.cos(radianAngle.value)) + radius / 2);
const top = computed(() => Math.round(radius * Math.sin(radianAngle.value)) + radius / 2);

onMounted(() => {
    radianAngle.value = toRadians(props.angle);
});

function mouseDown(): void {
    active = true;
}

function mouseUp(): void {
    if (active) {
        emit("change", toDegrees(radianAngle.value));
    }
    active = false;
}

function syncDegreeAngle(): void {
    emit("change", toDegrees(radianAngle.value));
}

function mouseMove(event: MouseEvent): void {
    if (active) {
        const circleRect = circle.value!.getBoundingClientRect();
        const center = { x: circleRect.left + circleRect.width / 2, y: circleRect.top + circleRect.height / 2 };

        const mPos = { x: event.x - center.x, y: event.y - center.y };
        radianAngle.value = Math.PI / 2 - Math.atan2(radius * mPos.x, radius * mPos.y);

        emit("input", toDegrees(radianAngle.value));
    }
}
</script>

<template>
    <div class="rotational-slider" :class="{ withNumber: showNumberInput }">
        <div
            class="circle"
            ref="circle"
            @mousedown="mouseDown"
            @mouseup="mouseUp"
            @mousemove="mouseMove"
            @mouseleave="mouseUp"
        >
            <div class="slider" :style="{ left: `${left}px`, top: `${top}px` }"></div>
        </div>
        <div v-if="showNumberInput"><input type="number" v-model.number="degreeAngle" @change="syncDegreeAngle" /></div>
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

    input[type="number"] {
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

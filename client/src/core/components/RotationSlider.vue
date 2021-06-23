<script lang="ts">
import { computed, defineComponent, onMounted, ref } from "vue";

import { toDegrees, toRadians } from "../conversions";

export default defineComponent({
    props: { angle: { type: Number, required: true } },
    emits: { input: Number, change: Number },
    setup(props, { emit }) {
        const circle = ref<HTMLDivElement | null>(null);

        let active = false;
        const radius = 10;
        const radianAngle = ref(0);

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

        function mouseMove(event: MouseEvent): void {
            if (active) {
                const circleRect = circle.value!.getBoundingClientRect();
                const center = { x: circleRect.left + circleRect.width / 2, y: circleRect.top + circleRect.height / 2 };

                const mPos = { x: event.x - center.x, y: event.y - center.y };
                radianAngle.value = Math.PI / 2 - Math.atan2(radius * mPos.x, radius * mPos.y);

                emit("input", toDegrees(radianAngle.value));
            }
        }

        return { circle, left, top, mouseDown, mouseUp, mouseMove };
    },
});
</script>

<template>
    <div
        id="circle"
        ref="circle"
        @mousedown="mouseDown"
        @mouseup="mouseUp"
        @mousemove="mouseMove"
        @mouseleave="mouseUp"
    >
        <div id="slider" ref="slider" :style="{ left: `${left}px`, top: `${top}px` }"></div>
    </div>
</template>

<style lang="scss" scoped>
#circle {
    width: 20px;
    height: 20px;
    border: 2px solid gray;
    border-radius: 100%;
}

#slider {
    position: relative;
    height: 10px;
    width: 10px;
    background: gray;
    border-radius: 100%;
    cursor: pointer;
}
</style>

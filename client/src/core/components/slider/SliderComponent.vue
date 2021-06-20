<script lang="ts">
import { computed, defineComponent, PropType, ref, watchEffect } from "vue";

import SliderDot from "./SliderDot.vue";
import { getPosByEvent } from "./utils";

// eslint-disable-next-line import/no-unused-modules
export default defineComponent({
    components: { SliderDot },
    props: {
        height: { type: String, default: "auto" },
        width: { type: String, default: "auto" },
        // eslint-disable-next-line vue/require-valid-default-prop
        dotSize: { type: Object as PropType<[number, number]>, default: () => [14, 14] },
        dotStyle: Object,
        railStyle: Object,
        min: { type: Number, default: 0 },
        max: { type: Number, default: 100 },
        interval: { type: Number, default: 1 },
        modelValue: { type: Number, required: true },
    },
    emits: ["update:modelValue", "change"],
    setup(props, { emit }) {
        const rail = ref<HTMLDivElement | null>(null);
        const dotPos = ref(0);
        const dragging = ref(false);
        const focussed = ref(false);

        const scale = computed(() => {
            if (rail.value !== null) {
                return Math.floor(rail.value.offsetWidth) / 100;
            }
            return 1;
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

        function blurd(): void {
            console.log(23);
        }

        return { blurd, dotPos, rail, dragging, focussed, scale, value, onClick, dragMove };
    },
});
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

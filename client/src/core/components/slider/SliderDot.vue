<script setup lang="ts">
import type { StyleValue } from "vue";

withDefaults(
    defineProps<{
        dotStyle?: StyleValue;
        dotSize?: [number, number];
        position: number;
        value?: number;
        focussed?: boolean;
    }>(),
    {
        dotSize: () => [14, 14],
        dotStyle: undefined,
        value: undefined,
        focussed: false,
    },
);
</script>

<template>
    <div
        class="vue-slider-dot vue-slider-dot-focus"
        :style="{ width: `${dotSize[0]}px`, height: `${dotSize[1]}px`, left: `${position}%` }"
    >
        <div class="vue-slider-dot-handle" :class="{ 'vue-slider-dot-handle-focus': focussed }" :style="dotStyle"></div>
        <div class="vue-slider-dot-tooltip" :class="{ 'vue-slider-dot-tooltip-show': focussed }">
            <div class="vue-slider-dot-tooltip-inner">
                <span class="vue-slider-dot-tooltip-text">{{ value?.toFixed(1) }}</span>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
$themeColor: #3498db !default;

$dotBorderRadius: 50% !default;
$dotBgColor: #fff !default;
$dotShadow: 0.5px 0.5px 2px 1px rgba(0, 0, 0, 0.32) !default;
$dotShadowFocus: 0px 0px 1px 2px rgba($themeColor, 0.36) !default;

$tooltipArrow: 5px !default;
$tooltipBgColor: $themeColor !default;
$tooltipBorderRadius: 5px !default;
$tooltipColor: #fff !default;
$tooltipGap: 10px;
$tooltipFontSize: 14px !default;
$tooltipMinWidth: 20px !default;
$tooltipPadding: 2px 5px !default;

.vue-slider-dot {
    position: absolute;

    transform: translate(-50%, -50%);
    top: 50%;
    left: 0;

    transition: left 0.5s;

    &:focus {
        outline: none;
    }

    @at-root &-handle {
        cursor: pointer;
        width: 100%;
        height: 100%;
        border-radius: $dotBorderRadius;
        background-color: $dotBgColor;
        box-sizing: border-box;
        box-shadow: $dotShadow;

        @at-root &-focus {
            box-shadow: $dotShadowFocus;
        }
    }
}

.vue-slider-dot-tooltip {
    position: absolute;
    visibility: hidden;
    bottom: -$tooltipGap;
    left: 50%;
    transform: translate(-50%, 100%);

    @at-root .vue-slider-dot-hover:hover & {
        visibility: visible;
    }

    &-show {
        visibility: visible;
    }

    @at-root &-inner {
        font-size: $tooltipFontSize;
        white-space: nowrap;
        padding: $tooltipPadding;
        min-width: $tooltipMinWidth;
        text-align: center;
        color: $tooltipColor;
        border-radius: $tooltipBorderRadius;
        border-color: $tooltipBgColor;
        background-color: $tooltipBgColor;
        box-sizing: content-box;

        &::after {
            content: "";
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translate(-50%, 0);
            height: 0;
            width: 0;

            border-color: transparent;
            border-style: solid;
            border-width: $tooltipArrow;
            border-bottom-color: inherit;
        }
    }
}
</style>

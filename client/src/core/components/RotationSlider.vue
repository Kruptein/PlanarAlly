<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";

import { toDegrees, toRadians } from "../../game/units";

@Component
export default class RotationSlider extends Vue {
    @Prop(Number) readonly angle!: number;
    $refs!: {
        circle: HTMLDivElement;
        slider: HTMLDivElement;
    };

    private radianAngle = 0;
    left = 0;
    top = 0;

    mounted(): void {
        this.radianAngle = toRadians(this.angle);
        this.left = this.getLeft();
        this.top = this.getTop();
    }

    private radius = 10;
    active = false;

    mouseDown(): void {
        this.active = true;
    }

    mouseUp(): void {
        if (this.active) this.$emit("change", toDegrees(this.radianAngle));
        this.active = false;
    }

    mouseMove(event: MouseEvent): void {
        if (this.active) {
            const circleRect = this.$refs.circle.getBoundingClientRect();
            const center = { x: circleRect.left + circleRect.width / 2, y: circleRect.top + circleRect.height / 2 };

            const mPos = { x: event.x - center.x, y: event.y - center.y };
            this.radianAngle = Math.PI / 2 - Math.atan2(this.radius * mPos.x, this.radius * mPos.y);

            this.left = this.getLeft();
            this.top = this.getTop();

            this.$emit("input", toDegrees(this.radianAngle));
        }
    }

    private getLeft(): number {
        return Math.round(this.radius * Math.cos(this.radianAngle)) + this.radius / 2;
    }

    private getTop(): number {
        return Math.round(this.radius * Math.sin(this.radianAngle)) + this.radius / 2;
    }
}
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

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

@Component
export default class RotationSlider extends Vue {
    $refs!: {
        circle: HTMLDivElement;
        slider: HTMLDivElement;
    };

    active = false;
    left = 5;
    top = -5;
    angle = 0;

    mouseDown(): void {
        this.active = true;
    }

    mouseUp(): void {
        this.active = false;
    }

    mouseMove(event: MouseEvent): void {
        if (this.active) {
            const radius = 10;

            const circleRect = this.$refs.circle.getBoundingClientRect();
            const center = { x: circleRect.left + circleRect.width / 2, y: circleRect.top + circleRect.height / 2 };

            const mPos = { x: event.x - center.x, y: event.y - center.y };
            this.angle = Math.atan2(radius * mPos.x, radius * mPos.y);

            this.left = Math.round(radius * Math.sin(this.angle)) + radius / 2;
            this.top = Math.round(radius * Math.cos(this.angle)) + radius / 2;

            console.log((this.angle * 180) / Math.PI);
        }
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

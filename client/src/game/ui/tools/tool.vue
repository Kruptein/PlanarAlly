<template>
    <div></div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import DefaultContext from "@/game/ui/tools/defaultcontext.vue";

@Component
export default class Tool extends Vue {
    name = "";
    selected = false;
    active = false;
    scaling = false;
    get detailRight(): string {
        const rect = (<any>this.$parent.$refs[this.name + "-selector"])[0].getBoundingClientRect();
        const mid = rect.left + rect.width / 2;

        return `${window.innerWidth - Math.min(window.innerWidth - 25, mid + 75)}px`;
    }
    get detailArrow(): string {
        const rect = (<any>this.$parent.$refs[this.name + "-selector"])[0].getBoundingClientRect();
        const mid = rect.left + rect.width / 2;
        const right = Math.min(window.innerWidth - 25, mid + 75);
        return `${right - mid - 14}px`; // border width
    }
    created(): void {
        this.$parent.$on("mousedown", (event: MouseEvent, tool: string) => {
            if (tool === this.name) this.onMouseDown(event);
        });
        this.$parent.$on("mouseup", (event: MouseEvent, tool: string) => {
            if (tool === this.name) this.onMouseUp(event);
        });
        this.$parent.$on("mousemove", (event: MouseEvent, tool: string) => {
            if (tool === this.name) this.onMouseMove(event);
        });
        this.$parent.$on("touchstart", (event: TouchEvent, tool: string) => {
            // a different tool cant trigger anothers event
            if (tool !== this.name) {
                return;
            }
            if (event.touches.length === 2) {
                this.scaling = true;
                this.onPinchStart(event);
            } else {
                this.onTouchStart(event);
            }
        });
        this.$parent.$on("touchend", (event: TouchEvent, tool: string) => {
            // a different tool cant trigger anothers event
            if (tool !== this.name) {
                return;
            }

            if (this.scaling) {
                this.onPinchEnd(event);
                this.scaling = false;
            } else {
                this.onTouchEnd(event);
            }
        });
        this.$parent.$on("touchmove", (event: TouchEvent, tool: string) => {
            // a different tool cant trigger anothers event
            if (tool !== this.name) {
                return;
            }

            if (this.scaling) {
                event.preventDefault();
                this.onPinchMove(event);
            }

            // determine the number of fingers on screen to trigger different events
            if (event.touches.length >= 3) {
                this.onThreeTouchMove(event);
            } else {
                this.onTouchMove(event);
            }
        });
        this.$parent.$on("contextmenu", (event: MouseEvent, tool: string) => {
            if (tool === this.name) this.onContextMenu(event);
        });
        this.$parent.$on("tools-select-change", (newValue: string, oldValue: string) => {
            if (oldValue === this.name) {
                this.selected = false;
                this.onDeselect();
            } else if (newValue === this.name) {
                this.selected = true;
                this.onSelect();
            }
        });
    }
    onSelect(): void {}
    onDeselect(): void {}
    onMouseDown(_event: MouseEvent): void {}
    onMouseUp(_event: MouseEvent): void {}
    onMouseMove(_event: MouseEvent): void {}
    onTouchStart(_event: TouchEvent): void {}
    onTouchEnd(_event: TouchEvent): void {}
    onTouchMove(_event: TouchEvent): void {}
    onThreeTouchMove(_event: TouchEvent): void {}
    onPinchStart(_event: TouchEvent): void {}
    onPinchMove(_event: TouchEvent): void {}
    onPinchEnd(_event: TouchEvent): void {}
    onContextMenu(event: MouseEvent): void {
        (<DefaultContext>this.$parent.$refs.defaultcontext).open(event);
    }
}
</script>

<style>
.tool-detail {
    position: absolute;
    right: var(--detailRight);
    bottom: 80px;
    z-index: 11;
    /* width: 150px; */
    border: solid 1px #2b2b2b;
    background-color: white;
    display: grid;
    padding: 10px;
    /* grid-template-columns: 50% 50%; */
    grid-template-columns: auto auto;
    grid-column-gap: 5px;
    grid-row-gap: 2px;
}
.tool-detail:after {
    content: "";
    position: absolute;
    right: var(--detailArrow);
    bottom: 0;
    width: 0;
    height: 0;
    border: 14px solid transparent;
    border-top-color: black;
    border-bottom: 0;
    margin-left: -14px;
    margin-bottom: -14px;
}

.tool-detail input {
    width: 100%;
    box-sizing: border-box;
}
</style>

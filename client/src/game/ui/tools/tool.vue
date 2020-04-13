<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import DefaultContext from "@/game/ui/tools/defaultcontext.vue";
import Tools from "./tools.vue";
import { ToolName, ToolPermission } from "./utils";

@Component
export default class Tool extends Vue {
    name: ToolName | null = null;
    selected = false;
    active = false;
    scaling = false;

    get permittedTools(): ToolPermission[] {
        return [];
    }

    hasFeature(feature: number, features: number[]): boolean {
        return features.length === 0 || features.includes(feature);
    }

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

    onSelect(): void {}
    onDeselect(): void {}
    onMouseDown(_event: MouseEvent, _features: number[]): void {}
    onMouseUp(_event: MouseEvent, _features: number[]): void {}
    onMouseMove(_event: MouseEvent, _features: number[]): void {}
    onTouchStart(_event: TouchEvent, _features: number[]): void {}
    onTouchEnd(_event: TouchEvent, _features: number[]): void {}
    onTouchMove(_event: TouchEvent, _features: number[]): void {}
    onThreeTouchMove(_event: TouchEvent, _features: number[]): void {}
    onPinchStart(_event: TouchEvent, _features: number[]): void {}
    onPinchMove(_event: TouchEvent, _features: number[]): void {}
    onPinchEnd(_event: TouchEvent, _features: number[]): void {}
    onContextMenu(event: MouseEvent, _features: number[]): void {
        (<DefaultContext>this.$parent.$refs.defaultcontext).open(event);
    }
}
</script>

<template>
    <div></div>
</template>

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

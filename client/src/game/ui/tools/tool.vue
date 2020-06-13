<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import DefaultContext from "@/game/ui/tools/defaultcontext.vue";
import { ToolName, ToolPermission, ToolFeatures } from "./utils";
import { LocalPoint } from "../../geom";
import { getLocalPointFromEvent } from "@/game/utils";
import { ToolBasics } from "./ToolBasics";

@Component
export default class Tool extends Vue implements ToolBasics {
    name: ToolName | null = null;
    selected = false;
    active = false;
    scaling = false;

    get permittedTools(): ToolPermission[] {
        return [];
    }

    hasFeature(feature: number, features: ToolFeatures): boolean {
        return (
            (!features.disabled?.includes(feature) ?? true) &&
            ((features.enabled?.length ?? 0) === 0 || (features.enabled?.includes(feature) ?? false))
        );
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

    onMouseDown(event: MouseEvent | TouchEvent, features: ToolFeatures): void {
        this.onDown(getLocalPointFromEvent(event), event, features);
    }
    onMouseUp(event: MouseEvent, features: ToolFeatures): void {
        this.onUp(getLocalPointFromEvent(event), event, features);
    }
    onMouseMove(event: MouseEvent, features: ToolFeatures): void {
        this.onMove(getLocalPointFromEvent(event), event, features);
    }
    onTouchStart(event: TouchEvent, features: ToolFeatures): void {
        this.onDown(getLocalPointFromEvent(event), event, features);
    }
    onTouchEnd(event: TouchEvent, features: ToolFeatures): void {
        this.onUp(getLocalPointFromEvent(event), event, features);
    }
    onTouchMove(event: TouchEvent, features: ToolFeatures): void {
        this.onMove(getLocalPointFromEvent(event), event, features);
    }
    onThreeTouchMove(_event: TouchEvent, _features: ToolFeatures): void {}
    onPinchStart(_event: TouchEvent, _features: ToolFeatures): void {}
    onPinchMove(_event: TouchEvent, _features: ToolFeatures): void {}
    onPinchEnd(_event: TouchEvent, _features: ToolFeatures): void {}
    onContextMenu(event: MouseEvent, _features: ToolFeatures): void {
        (<DefaultContext>this.$parent.$refs.defaultcontext).open(event);
    }

    onSelect(): void {}
    onDeselect(): void {}
    onDown(_lp: LocalPoint, _event: MouseEvent | TouchEvent, _features: ToolFeatures): void {}
    onUp(_lp: LocalPoint, _event: MouseEvent | TouchEvent, _features: ToolFeatures): void {}
    onMove(_lp: LocalPoint, _event: MouseEvent | TouchEvent, _features: ToolFeatures): void {}
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

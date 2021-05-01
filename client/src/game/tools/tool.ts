import { computed } from "@vue/runtime-core";
import { ref } from "vue";

import { LocalPoint } from "../../core/geometry";
import { onKeyUp } from "../input/keyboard";
import { getLocalPointFromEvent } from "../input/mouse";
import { ToolFeatures, ITool, ToolMode, ToolName, ToolPermission } from "../models/tools";

import { activeTool } from "./tools";

export abstract class Tool implements ITool {
    abstract readonly toolName: ToolName;
    abstract readonly toolTranslation: string;

    active = false;
    scaling = false;
    alert = ref(false);

    get permittedTools(): ToolPermission[] {
        return [];
    }

    isActiveTool = computed(() => activeTool.value === this.toolName);

    hasFeature(feature: number, features: ToolFeatures): boolean {
        return (
            !(features.disabled?.includes(feature) ?? false) &&
            ((features.enabled?.length ?? 0) === 0 || (features.enabled?.includes(feature) ?? false))
        );
    }

    onKeyUp(event: KeyboardEvent, _features: ToolFeatures): void {
        if (event.defaultPrevented) return;
        onKeyUp(event);
    }

    async onMouseDown(event: MouseEvent | TouchEvent, features: ToolFeatures): Promise<void> {
        await this.onDown(getLocalPointFromEvent(event), event, features);
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
    onContextMenu(_event: MouseEvent, _features: ToolFeatures): void {}

    onSelect(): void {}
    onDeselect(): void {}
    async onDown(_lp: LocalPoint, _event: MouseEvent | TouchEvent, _features: ToolFeatures): Promise<void> {}
    onUp(_lp: LocalPoint, _event: MouseEvent | TouchEvent, _features: ToolFeatures): void {}
    onMove(_lp: LocalPoint, _event: MouseEvent | TouchEvent, _features: ToolFeatures): void {}

    onToolsModeChange(_mode: ToolMode, _features: ToolFeatures): void {}
}

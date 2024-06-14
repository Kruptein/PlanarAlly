import { computed, ref } from "vue";

import type { LocalPoint } from "../../core/geometry";
import { onKeyDown } from "../input/keyboard/down";
import { onKeyUp } from "../input/keyboard/up";
import { getLocalPointFromEvent } from "../input/mouse";
import type { ToolFeatures, ITool, ToolMode, ToolName, ToolPermission } from "../models/tools";

import { activeTool } from "./tools";

export abstract class Tool implements ITool {
    abstract readonly toolName: ToolName;
    abstract readonly toolTranslation: string;

    active = ref(false);
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

    async onKeyDown(event: KeyboardEvent, _features: ToolFeatures): Promise<void> {
        if (event.defaultPrevented) return;
        await onKeyDown(event);
    }

    async onKeyUp(event: KeyboardEvent, _features: ToolFeatures): Promise<void> {
        if (event.defaultPrevented) return;
        await onKeyUp(event);
    }

    async onMouseDown(event: MouseEvent | TouchEvent, features: ToolFeatures): Promise<void> {
        await this.onDown(getLocalPointFromEvent(event), event, features);
    }
    async onMouseUp(event: MouseEvent, features: ToolFeatures): Promise<void> {
        await this.onUp(getLocalPointFromEvent(event), event, features);
    }
    async onMouseMove(event: MouseEvent, features: ToolFeatures): Promise<void> {
        await this.onMove(getLocalPointFromEvent(event), event, features);
    }
    async onTouchStart(event: TouchEvent, features: ToolFeatures): Promise<void> {
        await this.onDown(getLocalPointFromEvent(event), event, features);
    }
    async onTouchEnd(event: TouchEvent, features: ToolFeatures): Promise<void> {
        await this.onUp(getLocalPointFromEvent(event), event, features);
    }
    async onTouchMove(event: TouchEvent, features: ToolFeatures): Promise<void> {
        await this.onMove(getLocalPointFromEvent(event), event, features);
    }

    onThreeTouchMove(_event: TouchEvent, _features: ToolFeatures): void {}
    onPinchStart(_event: TouchEvent, _features: ToolFeatures): void {}
    onPinchMove(_event: TouchEvent, _features: ToolFeatures): void {}
    onPinchEnd(_event: TouchEvent, _features: ToolFeatures): void {}
    onContextMenu(_event: MouseEvent, _features: ToolFeatures): Promise<boolean> {
        return Promise.resolve(true);
    }

    onSelect(): Promise<void> {
        return Promise.resolve();
    }
    onDeselect(): void {}
    onDown(_lp: LocalPoint, _event: MouseEvent | TouchEvent | undefined, _features: ToolFeatures): Promise<void> {
        return Promise.resolve();
    }
    onUp(_lp: LocalPoint, _event: MouseEvent | TouchEvent | undefined, _features: ToolFeatures): Promise<void> {
        return Promise.resolve();
    }
    onMove(_lp: LocalPoint, _event: MouseEvent | TouchEvent | undefined, _features: ToolFeatures): Promise<void> {
        return Promise.resolve();
    }

    onToolsModeChange(_mode: ToolMode, _features: ToolFeatures): void {}
    onPanStart(): void {}
    onPanEnd(): void {}
}

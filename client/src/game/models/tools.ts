import type { Ref } from "vue";

export enum ToolName {
    Select = "Select",
    Pan = "Pan",
    Draw = "Draw",
    Ruler = "Ruler",
    Ping = "Ping",
    Map = "Map",
    Filter = "Filter",
    Vision = "Vision",
    Spell = "Spell",
    Dice = "Dice",
}

export type ToolPermission = { name: ToolName; features: ToolFeatures; early?: boolean };
export type ToolFeatures<T = number> = { enabled?: T[]; disabled?: T[] };

export enum ToolMode {
    Build,
    Play,
}

export interface ITool {
    readonly toolName: ToolName;
    readonly toolTranslation: string;

    alert: Ref<boolean>;
    active: Ref<boolean>;
    scaling: boolean;

    permittedTools: ToolPermission[];

    onToolsModeChange(mode: ToolMode, features: ToolFeatures): void;

    onSelect(): void;
    onDeselect(): void;

    onKeyUp(event: KeyboardEvent, features: ToolFeatures): void;

    onMouseUp(event: MouseEvent, features: ToolFeatures): Promise<void>;
    onMouseMove(event: MouseEvent, features: ToolFeatures): Promise<void>;
    onMouseDown(event: MouseEvent, features: ToolFeatures): void;

    onTouchStart(event: TouchEvent, features: ToolFeatures): void;
    onThreeTouchMove(event: TouchEvent, features: ToolFeatures): void;
    onTouchMove(event: TouchEvent, features: ToolFeatures): Promise<void>;
    onTouchEnd(event: TouchEvent, features: ToolFeatures): void;

    onPinchStart(event: TouchEvent, features: ToolFeatures): void;
    onPinchMove(event: TouchEvent, features: ToolFeatures): void;
    onPinchEnd(event: TouchEvent, features: ToolFeatures): void;

    onContextMenu(event: MouseEvent, features: ToolFeatures): void;
}

export interface ISelectTool extends ITool {
    resetRotationHelper(): void;
}

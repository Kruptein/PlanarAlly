import type { Ref } from "vue";

import type { LocalPoint } from "../../core/geometry";

export enum ToolName {
    Select = "Select",
    Pan = "Pan",
    Draw = "Draw",
    Ruler = "Ruler",
    Ping = "Ping",
    Map = "Map",
    Vision = "Vision",
    Spell = "Spell",
    Dice = "Dice",
    Note = "Note",
}

export interface ToolPermission {
    name: ToolName;
    features: ToolFeatures;
    early?: boolean;
}
export interface ToolFeatures<T = number> {
    enabled?: T[];
    disabled?: T[];
}

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

    onToolsModeChange: (mode: ToolMode, features: ToolFeatures) => void;
    onPanStart: () => void;
    onPanEnd: () => void;

    onSelect: () => void;
    onDeselect: () => void;

    onKeyDown: (event: KeyboardEvent, features: ToolFeatures) => Promise<void>;
    onKeyUp: (event: KeyboardEvent, features: ToolFeatures) => Promise<void>;

    onMouseUp: (event: MouseEvent, features: ToolFeatures) => Promise<void>;
    onMouseMove: (event: MouseEvent, features: ToolFeatures) => Promise<void>;
    onMouseDown: (event: MouseEvent, features: ToolFeatures) => void;

    onTouchStart: (event: TouchEvent, features: ToolFeatures) => void;
    onThreeTouchMove: (event: TouchEvent, features: ToolFeatures) => void;
    onTouchMove: (event: TouchEvent, features: ToolFeatures) => Promise<void>;
    onTouchEnd: (event: TouchEvent, features: ToolFeatures) => void;

    onPinchStart: (event: TouchEvent, features: ToolFeatures) => void;
    onPinchMove: (event: TouchEvent, features: ToolFeatures) => void;
    onPinchEnd: (event: TouchEvent, features: ToolFeatures) => void;

    onContextMenu: (event: MouseEvent, features: ToolFeatures) => Promise<boolean>;

    onDown: (_lp: LocalPoint, _event: MouseEvent | TouchEvent | undefined, _features: ToolFeatures) => Promise<void>;
    onMove: (_lp: LocalPoint, _event: MouseEvent | TouchEvent | undefined, _features: ToolFeatures) => Promise<void>;
    onUp: (_lp: LocalPoint, _event: MouseEvent | TouchEvent | undefined, _features: ToolFeatures) => Promise<void>;
}

export interface ISelectTool extends ITool {
    resetRotationHelper: () => void;
}

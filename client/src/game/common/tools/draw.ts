import type { Permissions } from "../../../apiTypes";
import type { DOOR_TOGGLE_MODE } from "../../core/systems/logic/door/models";

export enum DrawMode {
    Normal = "normal",
    Reveal = "reveal",
    Hide = "hide",
    Erase = "erase",
}

export enum DrawShape {
    Square = "square",
    Circle = "circle",
    Polygon = "draw-polygon",
    Brush = "paint-brush",
    Text = "font",
}

export enum DrawCategory {
    Shape = "square",
    Vision = "eye",
    Logic = "cogs",
}

export interface DrawToolState {
    selectedMode: DrawMode;
    selectedShape: DrawShape;
    selectedCategory: DrawCategory;

    fillColour: string;
    borderColour: string;

    isClosedPolygon: boolean;
    brushSize: number;

    blocksVision: boolean;
    blocksMovement: boolean;

    fontSize: number;

    isDoor: boolean;
    doorPermissions: Permissions;
    toggleMode: DOOR_TOGGLE_MODE;
}

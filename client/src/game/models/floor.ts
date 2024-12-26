import type { NumberId } from "../../core/id";

export type FloorId = NumberId<"floorId">;
export type FloorIndex = NumberId<"floorIndex">;

export interface Floor {
    id: FloorId; // This is only kept client side at the moment
    name: string;
    playerVisible: boolean;
    type: FloorType;
    backgroundValue?: string;
}

export enum LayerName {
    Map = "map",
    Grid = "grid",
    Tokens = "tokens",
    Dm = "dm",
    Lighting = "fow",
    Vision = "fow-players",
    Draw = "draw",
}

export enum FloorType {
    Underground,
    Ground,
    Air,
}

export function getFloorTypes(): string[] {
    return ["Underground", "Ground", "Air"];
}

export enum BackgroundType {
    None,
    Simple,
    Pattern,
}

export function getBackgroundTypes(): string[] {
    return ["None", "Simple", "Pattern"];
}

export function getBackgroundTypeFromString(background: string | null): BackgroundType {
    if (background === null || background === "none") {
        return BackgroundType.None;
    } else if (background.startsWith("rgb")) {
        return BackgroundType.Simple;
    } else if (background.startsWith("pattern")) {
        return BackgroundType.Pattern;
    } else {
        console.warn("Unknown background type ", background);
        return BackgroundType.None;
    }
}

export interface BackgroundPattern {
    hash: string;
    offsetX: number;
    offsetY: number;
    scaleX: number;
    scaleY: number;
}

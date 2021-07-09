export interface Floor {
    id: number; // This is only kept client side at the moment
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
}

export function getBackgroundTypes(): string[] {
    return ["None", "Simple"];
}

export function getBackgroundTypeFromString(background: string | null): BackgroundType {
    if (background === null || background === "none") {
        return BackgroundType.None;
    } else {
        return BackgroundType.Simple;
    }
}

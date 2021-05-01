export interface Floor {
    id: number; // This is only kept client side at the moment
    name: string;
    playerVisible: boolean;
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

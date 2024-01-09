import type { GlobalId } from "../../../id";

export interface WithDefault<T> {
    default: T;
    override?: T;
    value: T;
}
export interface WithLocationDefault<T> {
    default: T;
    value: T;
    location: Record<number, T | undefined>;
}

export interface LocationOptions {
    useGrid: boolean;
    gridType: string;
    unitSize: number;
    unitSizeUnit: string;
    fullFow: boolean;
    fowOpacity: number;
    fowLos: boolean;
    visionMode: string;
    visionMinRange: number;
    visionMaxRange: number;
    // too much hassle to work with localId here.
    // when switching locations this can be completely wrong
    spawnLocations: GlobalId[];
    movePlayerOnTokenChange: boolean;
    limitMovementDuringInitiative: boolean;
    dropRatio: number;

    airMapBackground: string;
    groundMapBackground: string;
    undergroundMapBackground: string;
}

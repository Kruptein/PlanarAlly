import type { DeepReadonly } from "vue";

import type { LocalId } from "../../../core/id";
import { buildState } from "../../../core/systems/state";

import { VisionBlock } from "./types";

export interface ShapeProperties {
    name: string;
    nameVisible: boolean;
    isToken: boolean;
    isInvisible: boolean;
    strokeColour: string[];
    fillColour: string;
    blocksMovement: boolean;
    blocksVision: VisionBlock;
    showBadge: boolean;
    isDefeated: boolean;
    isLocked: boolean;
    // grid related
    size: number; // if 0, infer size
    showCells: boolean;
    cellFillColour: string;
    cellStrokeColour: string;
    cellStrokeWidth: number;
    oddHexOrientation: boolean;
}

// type ReactivePropertiesState = Omit<ShapeProperties, "fillColour" | "strokeColour"> & {
//     id: LocalId | undefined;
//     strokeColour: string[] | undefined;
//     fillColour: string | undefined;
// };
interface PropertiesState {
    data: Map<LocalId, ShapeProperties>;
}

const state = buildState<PropertiesState, PropertiesState>(
    {
        data: new Map(),
        // id: undefined,
        // name: "Unknown Shape",
        // nameVisible: false,
        // isToken: false,
        // isInvisible: false,
        // strokeColour: undefined,
        // fillColour: undefined,
        // blocksMovement: false,
        // blocksVision: VisionBlock.No,
        // showBadge: false,
        // isDefeated: false,
        // isLocked: false,
        // size: 0,
        // showCells: true,
        // cellFillColour: "rgba(225, 0, 0, 0.2)",
        // cellStrokeColour: "rgba(225, 0, 0, 0.8)",
        // cellStrokeWidth: 5,
        // oddHexOrientation: false,
    },
    {
        data: new Map(),
    },
);

const DEFAULT_PROPERTIES: () => ShapeProperties = () => ({
    name: "Unknown Shape",
    nameVisible: true,
    isToken: false,
    isInvisible: false,
    isDefeated: false,
    isLocked: false,
    fillColour: "#000",
    strokeColour: ["rgba(0, 0, 0, 0)"],
    blocksMovement: false,
    blocksVision: VisionBlock.No,
    showBadge: false,
    size: 0,
    showCells: false,
    cellFillColour: "rgba(225, 0, 0, 0.2)",
    cellStrokeColour: "rgba(225, 0, 0, 0.8)",
    cellStrokeWidth: 5,
    oddHexOrientation: false,
});

export function getProperties(id: LocalId): DeepReadonly<ShapeProperties> | undefined {
    return state.readonly.data.get(id);
}

export const propertiesState = {
    ...state,
    DEFAULT: DEFAULT_PROPERTIES,
};

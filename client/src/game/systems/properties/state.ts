import type { DeepReadonly } from "vue";

import type { LocalId } from "../../../core/id";
import { buildState } from "../../../core/systems/state";

import { VisionBlock, type ShapeProperties } from "./types";

interface PropertiesState {
    data: Map<LocalId, ShapeProperties>;
}

const state = buildState<PropertiesState, PropertiesState>(
    {
        data: new Map(),
    },
    {
        data: new Map(),
    },
);

const DEFAULT_PROPERTIES: () => ShapeProperties = () => ({
    name: "Unknown Shape",
    nameVisible: true,
    isInvisible: false,
    isDefeated: false,
    isLocked: false,
    fillColour: "#000",
    strokeColour: ["rgba(0, 0, 0, 0)"],
    blocksMovement: false,
    blocksVision: VisionBlock.No,
    showBadge: false,
    size: { x: 0, y: 0 },
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

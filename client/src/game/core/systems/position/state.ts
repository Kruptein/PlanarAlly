import type { LocalPoint } from "../../../../core/geometry";
import type { LocalId } from "../../id";
import { buildState } from "../state";

export const DEFAULT_GRID_SIZE = 50;

const state = buildState(
    {
        outOfBounds: false,
        zoomDisplay: 0.5,
        tokenDirections: new Map<LocalId, LocalPoint | undefined>(),
    },
    {
        gridOffset: { x: 0, y: 0 },
        zoom: 1, // NaN,
        panX: 0,
        panY: 0,
        performOobCheck: false,
    },
);

export const positionState = {
    ...state,
};

import { buildState } from "../state";

export const DEFAULT_GRID_SIZE = 50;

const state = buildState(
    {
        zoomDisplay: 0.5,
    },
    {
        gridOffset: { x: 0, y: 0 },
        zoom: NaN,
        panX: 0,
        panY: 0,
    },
);

export const positionState = {
    ...state,
};

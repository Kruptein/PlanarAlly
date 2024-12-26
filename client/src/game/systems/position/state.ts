import type { LocalPoint } from "../../../core/geometry";
import type { LocalId } from "../../../core/id";
import { buildState } from "../../../core/systems/state";

const state = buildState(
    {
        outOfBounds: false,
        zoomDisplay: 0.5,
        tokenDirections: new Map<LocalId, LocalPoint | undefined>(),
    },
    {
        gridOffset: { x: 0, y: 0 },
        zoom: NaN,
        panX: 0,
        panY: 0,
        performOobCheck: false,
    },
);

export const positionState = {
    ...state,
};

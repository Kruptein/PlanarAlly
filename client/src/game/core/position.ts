import { g2l } from "../../core/conversions";
import type { GlobalPoint } from "../../core/geometry";

import { sendClientLocationOptions } from "./api/emits/client";
import { floorSystem } from "./systems/floors";
import { positionSystem } from "./systems/position";
import { positionState } from "./systems/position/state";

export function setCenterPosition(position: GlobalPoint): void {
    const localPos = g2l(position);
    const state = positionState.readonly;
    positionSystem.increasePan(
        (window.innerWidth / 2 - localPos.x) / state.zoom,
        (window.innerHeight / 2 - localPos.y) / state.zoom,
    );
    floorSystem.invalidateAllFloors();
    sendClientLocationOptions(false);
}

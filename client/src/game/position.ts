import { g2l } from "../core/conversions";
import type { GlobalPoint } from "../core/geometry";
import { clientStore } from "../store/client";

import { sendClientLocationOptions } from "./api/emits/client";
import { floorSystem } from "./systems/floors";

export function setCenterPosition(position: GlobalPoint): void {
    const localPos = g2l(position);
    clientStore.increasePan(
        (window.innerWidth / 2 - localPos.x) / clientStore.zoomFactor.value,
        (window.innerHeight / 2 - localPos.y) / clientStore.zoomFactor.value,
    );
    floorSystem.invalidateAllFloors();
    sendClientLocationOptions();
}

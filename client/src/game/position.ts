import { g2l } from "../core/conversions";
import type { GlobalPoint } from "../core/geometry";
import { clientStore, ZOOM } from "../store/client";

import { sendClientLocationOptions } from "./api/emits/client";
import { floorSystem } from "./systems/floors";

export function setCenterPosition(position: GlobalPoint): void {
    const localPos = g2l(position);
    clientStore.increasePan((window.innerWidth / 2 - localPos.x) / ZOOM, (window.innerHeight / 2 - localPos.y) / ZOOM);
    floorSystem.invalidateAllFloors();
    sendClientLocationOptions(false);
}

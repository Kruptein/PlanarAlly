import { clearSystems } from "../core/systems";
import type { SystemClearReason } from "../core/systems/models";
import { locationStore } from "../store/location";

import { clearIds } from "./id";
import { stopDrawLoop } from "./rendering/core";
import { initiativeStore } from "./ui/initiative/state";
import { visionState } from "./vision/state";

export function clearGame(reason: SystemClearReason): void {
    stopDrawLoop();
    visionState.clear();
    locationStore.setLocations([], false);
    const layers = document.getElementById("layers");
    if (layers) layers.innerHTML = "";
    initiativeStore.clear();
    clearSystems(reason);
    clearIds();
}

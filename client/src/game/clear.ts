import { lastGameboardStore } from "../store/lastGameboard";
import { locationStore } from "../store/location";

import { clearIds } from "./id";
import { compositeState } from "./layers/state";
import { stopDrawLoop } from "./rendering/core";
import { clearSystems } from "./systems";
import type { SystemClearReason } from "./systems/models";
import { initiativeStore } from "./ui/initiative/state";
import { visionState } from "./vision/state";

export function clearGame(reason: SystemClearReason): void {
    stopDrawLoop();
    visionState.clear();
    locationStore.setLocations([], false);
    document.getElementById("layers")!.innerHTML = "";
    compositeState.clear();
    initiativeStore.clear();
    lastGameboardStore.clear();
    clearSystems(reason);
    clearIds();
}

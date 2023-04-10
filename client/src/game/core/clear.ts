import { lastGameboardStore } from "../../store/lastGameboard";
import { locationStore } from "../../store/location";
import { initiativeStore } from "../dom/ui/initiative/state";

import { clearIds } from "./id";
import { compositeState } from "./layers/state";
import { stopDrawLoop } from "./rendering/core";
import { clearSystems } from "./systems";
import { visionState } from "./vision/state";

export function clearGame(partial: boolean): void {
    stopDrawLoop();
    visionState.clear();
    locationStore.setLocations([], false);
    // document.getElementById("layers")!.innerHTML = "";
    compositeState.clear();
    initiativeStore.clear();
    lastGameboardStore.clear();
    clearSystems(partial);
    clearIds();
}

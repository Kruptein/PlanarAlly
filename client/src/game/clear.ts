import { floorStore } from "../store/floor";
import { gameStore } from "../store/game";
import { locationStore } from "../store/location";

import { clearClientRects } from "./client";
import { stopDrawLoop } from "./draw";
import { clearIds } from "./id";
import { compositeState } from "./layers/state";
import { clearSystems } from "./systems";
import { initiativeStore } from "./ui/initiative/state";
import { visionState } from "./vision/state";

export function clearGame(): void {
    stopDrawLoop();
    clearClientRects();
    gameStore.clear();
    visionState.clear();
    locationStore.setLocations([], false);
    document.getElementById("layers")!.innerHTML = "";
    floorStore.clear();
    compositeState.clear();
    initiativeStore.clear();
    clearSystems();
    clearIds();
}

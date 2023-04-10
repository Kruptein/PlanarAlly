import { floorSystem } from "../systems/floors";
// import { floorState } from "../systems/floors/state";

export function recalculateZIndices(): void {
    // let i = 0;
    // for (const floor of floorState.readonly.floors) {
    //     for (const layer of floorSystem.getLayers(floor)) {
    //         layer.canvas.style.zIndex = `${i}`;
    //         i += 1;
    //     }
    // }
    floorSystem.updateLayerVisibility();
    floorSystem.invalidateAllFloors();
}

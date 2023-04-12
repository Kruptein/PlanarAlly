import { floorSystem } from "../systems/floors";
import { floorState } from "../systems/floors/state";

export function recalculateZIndices(): void {
    const indices = new Map<string, string>();
    let i = 0;
    for (const floor of floorState.readonly.floors) {
        for (const layer of floorSystem.getLayers(floor)) {
            indices.set(`${floor.id}-${layer.name}`, `${i}`);
            // layer.canvas.style.zIndex = `${i}`;
            i += 1;
        }
    }
    floorSystem.updateLayerVisibility(indices);
    floorSystem.invalidateAllFloors();
}

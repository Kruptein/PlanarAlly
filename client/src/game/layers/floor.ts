import { floorStore } from "../../store/floor";

export function recalculateZIndices(): void {
    let i = 0;
    for (const floor of floorStore.state.floors) {
        for (const layer of floorStore.getLayers(floor)) {
            layer.canvas.style.zIndex = `${i}`;
            i += 1;
        }
    }
}

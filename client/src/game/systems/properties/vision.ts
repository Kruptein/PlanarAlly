import { getShape } from "../../id";
import type { LocalId } from "../../id";
import { TriangulationTarget, visionState } from "../../vision/state";
import { floorState } from "../floors/state";

export function checkVisionSources(id: LocalId, blocksVision: boolean, recalculate = true): boolean {
    const floor = getShape(id)?.floor?.id ?? floorState.currentFloor.value!.id;

    let alteredVision = false;
    const visionBlockers = visionState.getBlockers(TriangulationTarget.VISION, floor);
    const obstructionIndex = visionBlockers.indexOf(id);
    if (blocksVision && obstructionIndex === -1) {
        visionState.addBlocker(TriangulationTarget.VISION, id, floor, recalculate);
        alteredVision = true;
    } else if (!blocksVision && obstructionIndex >= 0) {
        visionState.sliceBlockers(TriangulationTarget.VISION, obstructionIndex, floor, recalculate);
        alteredVision = true;
    }
    return alteredVision;
}

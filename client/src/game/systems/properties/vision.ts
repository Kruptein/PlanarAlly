import type { LocalId } from "../../../core/id";
import { getShape } from "../../id";
import { TriangulationTarget, visionState } from "../../vision/state";
import { floorState } from "../floors/state";

export function checkVisionSources(id: LocalId, blocksVision: boolean, recalculate = true): boolean {
    const floor = getShape(id)?.floorId ?? floorState.currentFloor.value!.id;

    let alteredVision = false;
    const visionBlockers = visionState.getBlockers(TriangulationTarget.VISION, floor);
    const obstructionIndex = visionBlockers.indexOf(id);
    if (blocksVision) {
        if (obstructionIndex === -1) {
            visionState.addBlocker(TriangulationTarget.VISION, id, floor, recalculate);
        } else {
            // This should be done if the vision block mode changes between Complete/Behind
            // in theory this also triggers if for some reason this function is reran without changes.
            // That should not happen in the first place, and if it does, it's not a big deal to do an extra recalc.
            visionState.recalculateVision(floor);
        }
        alteredVision = true;
    } else if (!blocksVision && obstructionIndex >= 0) {
        visionState.sliceBlockers(TriangulationTarget.VISION, obstructionIndex, floor, recalculate);
        alteredVision = true;
    }
    return alteredVision;
}

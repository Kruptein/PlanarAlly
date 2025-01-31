import type { LocalId } from "../../../core/id";
import { getShape } from "../../id";
import { TriangulationTarget, visionState } from "../../vision/state";
import { floorState } from "../floors/state";

export function checkMovementSources(id: LocalId, blocksMovement: boolean, recalculate = true): boolean {
    const floor = getShape(id)?.floorId ?? floorState.currentFloor.value!.id;

    let alteredMovement = false;
    const movementBlockers = visionState.getBlockers(TriangulationTarget.MOVEMENT, floor);
    const obstructionIndex = movementBlockers.indexOf(id);
    if (blocksMovement && obstructionIndex === -1) {
        visionState.addBlocker(TriangulationTarget.MOVEMENT, id, floor, recalculate);
        alteredMovement = true;
    } else if (!blocksMovement && obstructionIndex >= 0) {
        visionState.sliceBlockers(TriangulationTarget.MOVEMENT, obstructionIndex, floor, recalculate);
        alteredMovement = true;
    }
    return alteredMovement;
}

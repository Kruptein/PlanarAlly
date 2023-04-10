import { type LocalPoint, subtractP } from "../../../core/geometry";
import { sendClientLocationOptions } from "../api/emits/client";
import { floorSystem } from "../systems/floors";
import { positionSystem } from "../systems/position";
import { positionState } from "../systems/position/state";

export function mousePan(origin: LocalPoint, target: LocalPoint, fullPan: boolean): void {
    const distance = subtractP(target, origin).multiply(1 / positionState.readonly.zoom);
    positionSystem.increasePan(Math.round(distance.x), Math.round(distance.y));

    if (fullPan) floorSystem.invalidateAllFloors();
    else floorSystem.invalidateVisibleFloors();
    sendClientLocationOptions(!fullPan);
}

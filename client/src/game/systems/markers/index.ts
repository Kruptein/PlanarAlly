import type { LocalId } from "../../../core/id";
import { registerSystem } from "../../../core/systems";
import type { System } from "../../../core/systems";
import { getGlobalId, getShape } from "../../id";
import { setCenterPosition } from "../../position";
import { floorSystem } from "../floors";

import { sendMarkerCreate, sendMarkerRemove } from "./emits";
import { markerState } from "./state";

const { mutableReactive: $ } = markerState;

class MarkerSystem implements System {
    clear(): void {
        $.markers.clear();
    }

    newMarker(marker: LocalId, sync: boolean): void {
        if (!$.markers.has(marker)) {
            $.markers.add(marker);
            if (sync) {
                const gId = getGlobalId(marker);
                if (gId) sendMarkerCreate(gId);
            }
        }
    }

    jumpToMarker(marker: LocalId): void {
        const shape = getShape(marker);
        if (shape == undefined) return;
        setCenterPosition(shape.center);
        if (shape.floorId !== undefined) floorSystem.selectFloor({ id: shape.floorId }, true);
    }

    removeMarker(marker: LocalId, sync: boolean): void {
        if ($.markers.has(marker)) {
            $.markers.delete(marker);
            if (sync) {
                const gId = getGlobalId(marker);
                if (gId) sendMarkerRemove(gId);
            }
        }
    }
}

export const markerSystem = new MarkerSystem();
registerSystem("markers", markerSystem, false, markerState);

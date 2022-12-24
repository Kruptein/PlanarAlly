import { registerSystem } from "..";
import type { System } from "..";
import { getGlobalId, getShape } from "../../id";
import type { LocalId } from "../../id";
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
            if (sync) sendMarkerCreate(getGlobalId(marker));
        }
    }

    jumpToMarker(marker: LocalId): void {
        const shape = getShape(marker);
        if (shape == undefined) return;
        setCenterPosition(shape.center);
        floorSystem.selectFloor({ name: shape.floor.name }, true);
    }

    removeMarker(marker: LocalId, sync: boolean): void {
        if ($.markers.has(marker)) {
            $.markers.delete(marker);
            if (sync) sendMarkerRemove(getGlobalId(marker));
        }
    }
}

export const markerSystem = new MarkerSystem();
registerSystem("markers", markerSystem, false, markerState);

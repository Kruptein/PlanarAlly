import { l2g } from "../../core/conversions";
import { toLP } from "../../core/geometry";
import type { LocalPoint } from "../../core/geometry";
import { positionSystem } from "../systems/position";
import { positionState } from "../systems/position/state";

export function scrollZoom(e: WheelEvent): void {
    if (!e.target || !(e.target as HTMLElement).tagName || (e.target as HTMLElement).tagName !== "CANVAS") return;
    const delta = e.deltaY / 1000;
    positionSystem.updateZoom(positionState.raw.zoomDisplay + delta, l2g(getLocalPointFromEvent(e)));
}

export function getLocalPointFromEvent(e: MouseEvent | TouchEvent): LocalPoint {
    if (e instanceof MouseEvent) {
        return getMouse(e);
    } else if (e instanceof TouchEvent) {
        return getTouch(e);
    } else {
        return getMouse(e);
    }
}

function getMouse(e: MouseEvent): LocalPoint {
    return toLP(e.pageX, e.pageY);
}

// takes a given touch event and converts to LocalPoint
function getTouch(e: TouchEvent): LocalPoint {
    // touches is a TouchList, which is a list of touches (for each finger)
    // default to first touch (first index) to get x/y
    return toLP(e.changedTouches[0]?.pageX ?? 0, e.changedTouches[0]?.pageY ?? 0);
}

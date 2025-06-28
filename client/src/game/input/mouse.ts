import { l2g } from "../../core/conversions";
import { toLP } from "../../core/geometry";
import type { LocalPoint } from "../../core/geometry";
import { positionSystem } from "../systems/position";
import { positionState } from "../systems/position/state";

export function scrollZoom(e: WheelEvent): void {
    if (!e.target || !(e.target as HTMLElement).tagName || (e.target as HTMLElement).tagName !== "CANVAS") return;
    const rawDelta = e.deltaY / 1000;

    // Our zoom display is a value between 0 and 1, where 0 is the smallest zoom and 1 is the largest zoom.
    // Given the exponential nature of the zoom curve (see zoomDisplayToFactor),
    // a linear scroll causes rapid jumps in zoom level at small values, while more smooth changes at larger values.
    // Ideally this is just smooth all over. So we're going to add a non-linear scaling to alleviate this.
    const currentZoom = positionState.raw.zoomDisplay;
    // At zoom 0, we want to slow down the scaling so we use a power >1,
    // towards the end of the curve we want to increase the scaling so we use a power <1
    const scalingFactor = 1.3 - currentZoom * 0.7;
    const scaledDelta = Math.sign(rawDelta) * Math.pow(Math.abs(rawDelta), scalingFactor);

    positionSystem.updateZoom(currentZoom + scaledDelta, l2g(getLocalPointFromEvent(e)));
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

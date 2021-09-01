import { l2g } from "../../core/conversions";
import { toLP } from "../../core/geometry";
import type { LocalPoint } from "../../core/geometry";
import { clientStore } from "../../store/client";

export function scrollZoom(e: WheelEvent): void {
    if (!e.target || !(e.target as HTMLElement).tagName || (e.target as HTMLElement).tagName !== "CANVAS") return;
    const delta = Math.sign(e.deltaY) * -1;
    clientStore.updateZoom(clientStore.state.zoomDisplay - 0.1 * delta, l2g(getLocalPointFromEvent(e)));
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
    return toLP(e.changedTouches[0].pageX, e.changedTouches[0].pageY);
}

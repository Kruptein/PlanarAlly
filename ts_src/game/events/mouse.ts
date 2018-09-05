import store from "../store";

import { l2g } from "../units";
import { getMouse } from "../utils";

export function scrollZoom(e: WheelEvent) {
    if (!e.target || !(<HTMLElement>e.target).tagName || (<HTMLElement>e.target).tagName !== "CANVAS") return;
    let delta: number;
    if (e.wheelDelta) {
        delta = Math.sign(e.wheelDelta) * 1;
    } else {
        delta = Math.sign(e.deltaY) * -1;
    }
    store.commit("updateZoom", {
        newZoomValue: store.state.zoomFactor + 0.1 * delta,
        zoomLocation: l2g(getMouse(e)),
    });
}

import store from "@/game/store";

import { l2g } from "@/game/units";
import { getMouse } from "@/game/utils";

export function scrollZoom(e: WheelEvent) {
    if (!e.target || !(<HTMLElement>e.target).tagName || (<HTMLElement>e.target).tagName !== "CANVAS") return;
    let delta: number;
    if (e.wheelDelta) {
        delta = Math.sign(e.wheelDelta) * 1;
    } else {
        delta = Math.sign(e.deltaY) * -1;
    }
    // store.commit("updateZoom", {
    //     newZoomValue: store.state.game.zoomFactor + 0.1 * delta,
    //     zoomLocation: l2g(getMouse(e)),
    // });
}

import { getMouse } from "../utils";
import { l2g } from "../units";
import store from "../store";
export function scrollZoom(e) {
    if (!e.target || !e.target.tagName || e.target.tagName !== 'CANVAS')
        return;
    let delta;
    if (e.wheelDelta) {
        delta = Math.sign(e.wheelDelta) * 1;
    }
    else {
        delta = Math.sign(e.deltaY) * -1;
    }
    store.commit('updateZoom', {
        newZooMValue: store.state.zoomFactor + 0.1 * delta,
        zoomLocation: l2g(getMouse(e))
    });
}
//# sourceMappingURL=mouse.js.map
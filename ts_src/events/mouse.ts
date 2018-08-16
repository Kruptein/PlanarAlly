import { getMouse } from "../utils";
import { l2g } from "../units";
import Settings from "../settings";

export function scrollZoom(e: WheelEvent) {
    if (!e.target || !(<HTMLElement>e.target).tagName || (<HTMLElement>e.target).tagName !== 'CANVAS') return;
    let delta: number;
    if (e.wheelDelta) {
        delta = Math.sign(e.wheelDelta) * 1;
    } else {
        delta = Math.sign(e.deltaY) * -1;
    }
    Settings.updateZoom(Settings.zoomFactor + 0.1 * delta, l2g(getMouse(e)));
}
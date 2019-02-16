import { gameStore } from "@/game/store";
import { l2g } from "@/game/units";
import { getMouse } from "@/game/utils";

export function scrollZoom(e: WheelEvent) {
    if (!e.target || !(<HTMLElement>e.target).tagName || (<HTMLElement>e.target).tagName !== "CANVAS") return;
    let delta: number;
    delta = Math.sign(e.deltaY) * -1;
    gameStore.updateZoom({ newZoomDisplay: gameStore.zoomDisplay - 0.1 * delta, zoomLocation: l2g(getMouse(e)) });
}

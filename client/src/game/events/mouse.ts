import { gameStore } from "@/game/store";
import { l2g } from "@/game/units";
import { getLocalPointFromEvent } from "@/game/utils";

export function scrollZoom(e: WheelEvent): void {
    if (!e.target || !(<HTMLElement>e.target).tagName || (<HTMLElement>e.target).tagName !== "CANVAS") return;
    const delta = Math.sign(e.deltaY) * -1;
    gameStore.updateZoom({
        newZoomDisplay: gameStore.zoomDisplay - 0.1 * delta,
        zoomLocation: l2g(getLocalPointFromEvent(e)),
    });
}

import tinycolor from "tinycolor2";

import { LocalPoint } from "@/game/geom";
import { gameStore } from "@/game/store";

export function getMouse(e: MouseEvent): LocalPoint {
    return new LocalPoint(e.pageX, e.pageY);
}

export function getFogColour(opposite: boolean = false): string {
    const tc = tinycolor(gameStore.fowColour);
    if (gameStore.IS_DM) tc.setAlpha(opposite ? 1 : gameStore.fowOpacity);
    else tc.setAlpha(1);
    return tc.toRgbString();
}

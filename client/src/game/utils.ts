import tinycolor from "tinycolor2";

import { LocalPoint } from "@/game/geom";
import { gameStore } from "./store";

export function getMouse(e: MouseEvent): LocalPoint {
    return new LocalPoint(e.pageX, e.pageY);
}

export function getFogColour(opposite = false): string {
    const tc = tinycolor(gameStore.fowColour);
    if (gameStore.IS_DM) tc.setAlpha(opposite ? 1 : gameStore.fowOpacity);
    else tc.setAlpha(1);
    return tc.toRgbString();
}

export function zoomValue(display: number): number {
    // Powercurve 0.2/3/10
    // Based on https://stackoverflow.com/a/17102320
    return 1 / (-5 / 3 + (28 / 15) * Math.exp(1.83 * display));
}

export function zoomDisplay(value: number): number {
    return Math.log((1 / value + 5 / 3) * (15 / 28)) / 1.83;
}

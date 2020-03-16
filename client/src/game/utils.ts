import tinycolor from "tinycolor2";

import { LocalPoint } from "@/game/geom";
import { gameStore } from "./store";

export function getLocalPointFromEvent(e: any): LocalPoint {
    if (e instanceof MouseEvent) {
        return getMouse(e);
    } else if (e instanceof TouchEvent) {
        return getTouch(e);
    } else {
        return getMouse(e);
    }
}

function getMouse(e: MouseEvent): LocalPoint {
    return new LocalPoint(e.pageX, e.pageY);
}

// takes a given touch event and converts to LocalPoint
function getTouch(e: TouchEvent): LocalPoint {
    // touches is a TouchList, which is a list of touches (for each finger)
    // default to first touch (first index) to get x/y
    return new LocalPoint(e.touches[0].pageX, e.touches[0].pageY);
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

export function equalPoint(a: number, b: number, delta = 0.0001): boolean {
    return a - delta < b && a + delta > b;
}

export function equalPoints(a: number[], b: number[]): boolean {
    return equalPoint(a[0], b[0]) && equalPoint(a[1], b[1]);
}

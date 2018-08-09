import { LocalPoint } from "./geom";
import Settings from "./settings";
import gameManager from "./planarally";

export function getMouse(e: MouseEvent): LocalPoint {
    return new LocalPoint(e.pageX, e.pageY);
}

export function getFogColour(opposite: boolean = false): string {
    const tc = gameManager.fowColour.spectrum("get");
    if (Settings.IS_DM)
        tc.setAlpha(opposite ? 1 : Settings.fowOpacity);
    else
        tc.setAlpha(1);
    return tc.toRgbString();
}
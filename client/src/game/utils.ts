import tinycolor from "tinycolor2";

import store from "@/game/store";

import { LocalPoint } from "@/game/geom";

export function getMouse(e: MouseEvent): LocalPoint {
    return new LocalPoint(e.pageX, e.pageY);
}

export function getFogColour(opposite: boolean = false): string {
    const tc = tinycolor(store.fowColour);
    if (store.IS_DM) tc.setAlpha(opposite ? 1 : store.fowOpacity);
    else tc.setAlpha(1);
    return tc.toRgbString();
}

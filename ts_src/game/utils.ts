import * as tinycolor from "tinycolor2";

import store from "./store";

import { LocalPoint } from "./geom";

export function getMouse(e: MouseEvent): LocalPoint {
    return new LocalPoint(e.pageX, e.pageY);
}

export function getFogColour(opposite: boolean = false): string {
    const tc = tinycolor(store.state.fowColour);
    if (store.state.IS_DM) tc.setAlpha(opposite ? 1 : store.state.fowOpacity);
    else tc.setAlpha(1);
    return tc.toRgbString();
}

import { LocalPoint } from "./geom";
import store from "./store";
export function getMouse(e) {
    return new LocalPoint(e.pageX, e.pageY);
}
export function getFogColour(opposite = false) {
    const tc = tinycolor(store.state.fowColour);
    if (store.state.IS_DM)
        tc.setAlpha(opposite ? 1 : store.state.fowOpacity);
    else
        tc.setAlpha(1);
    return tc.toRgbString();
}
//# sourceMappingURL=utils.js.map
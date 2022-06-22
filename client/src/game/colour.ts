import tinycolor from "tinycolor2";

import { getGameState } from "../store/_game";
import { clientStore } from "../store/client";
import { settingsStore } from "../store/settings";

export function getFogColour(opposite = false): string {
    const tc = tinycolor(clientStore.state.fowColour);
    if (getGameState().isDm) tc.setAlpha(opposite ? 1 : settingsStore.fowOpacity.value);
    else tc.setAlpha(1);
    return tc.toRgbString();
}

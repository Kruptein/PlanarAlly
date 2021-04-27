import tinycolor from "tinycolor2";

import { clientStore } from "../store/client";
import { gameStore } from "../store/game";
import { settingsStore } from "../store/settings";

export function getFogColour(opposite = false): string {
    const tc = tinycolor(clientStore.state.fowColour);
    if (gameStore.state.isDm) tc.setAlpha(opposite ? 1 : settingsStore.fowOpacity.value);
    else tc.setAlpha(1);
    return tc.toRgbString();
}

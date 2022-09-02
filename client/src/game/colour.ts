import tinycolor from "tinycolor2";

import { getGameState } from "../store/_game";
import { settingsStore } from "../store/settings";

import { playerSettingsState } from "./systems/settings/players/state";

export function getFogColour(opposite = false): string {
    const tc = tinycolor(playerSettingsState.raw.fowColour.value);
    if (getGameState().isDm) tc.setAlpha(opposite ? 1 : settingsStore.fowOpacity.value);
    else tc.setAlpha(1);
    return tc.toRgbString();
}

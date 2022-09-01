import tinycolor from "tinycolor2";

import { getGameState } from "../store/_game";
import { settingsStore } from "../store/settings";

import { playerSettingsState } from "./systems/settings/players/state";

export let FOG_COLOUR = getFogColour();

export function updateFogColour(): void {
    FOG_COLOUR = getFogColour();
}

function getFogColour(): string {
    const tc = tinycolor(playerSettingsState.raw.fowColour.value);
    if (getGameState().isDm) tc.setAlpha(settingsStore.fowOpacity.value);
    else tc.setAlpha(1);
    return tc.toRgbString();
}

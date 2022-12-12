import tinycolor from "tinycolor2";

import { getGameState } from "../store/_game";

import { locationSettingsState } from "./systems/settings/location/state";
import { playerSettingsState } from "./systems/settings/players/state";

export let FOG_COLOUR = getFogColour();

export function updateFogColour(): void {
    FOG_COLOUR = getFogColour();
}

function getFogColour(): string {
    const tc = tinycolor(playerSettingsState.raw.fowColour.value);
    if (getGameState().isDm) tc.setAlpha(locationSettingsState.raw.fowOpacity.value);
    else tc.setAlpha(1);
    return tc.toRgbString();
}

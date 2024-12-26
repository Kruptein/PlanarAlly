import tinycolor from "tinycolor2";

import type { LocalId } from "../core/id";

import { gameState } from "./systems/game/state";
import { locationSettingsState } from "./systems/settings/location/state";
import { playerSettingsState } from "./systems/settings/players/state";

export let FOG_COLOUR = getFogColour();

export enum Colour {
    Fog = "core:fog",
    Wall = "core:default-wall",
    Window = "core:default-window",
    Door = "core:default-door",
}

const colourMapping = new Map<Colour | string, string | ((id: LocalId | undefined) => string | undefined)>([
    [Colour.Fog, FOG_COLOUR],
]);

export function registerColour(
    colour: Colour | string,
    value: string | ((id: LocalId | undefined) => string | undefined),
): void {
    colourMapping.set(colour, value);
}

export function updateFogColour(): void {
    FOG_COLOUR = getFogColour();
}

function getFogColour(): string {
    const tc = tinycolor(playerSettingsState.raw.fowColour.value);
    if (gameState.raw.isDm) tc.setAlpha(locationSettingsState.raw.fowOpacity.value);
    else tc.setAlpha(1);
    return tc.toRgbString();
}

function isSpecialColour(colour: Colour | string): colour is Colour {
    return colour.startsWith("core:");
}

export function getColour(colour: Colour | string, id: LocalId | undefined): string {
    if (!isSpecialColour(colour)) return colour;
    const result = colourMapping.get(colour);
    if (typeof result === "function") return result(id) ?? colour;
    return result ?? colour;
}

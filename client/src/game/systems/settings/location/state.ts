import { buildState } from "../../state";

import type { LocationOptions, WithDefault, WithLocationDefault } from "./models";

const init = <T>(x: T): WithLocationDefault<T> => ({ default: x, location: {}, value: x });

const state = buildState<
    { activeLocation: number } & { [key in keyof LocationOptions]: WithLocationDefault<LocationOptions[key]> }
>({
    activeLocation: 0,

    fowLos: init(false),
    fowOpacity: init(0),
    gridType: init("SQUARE"),
    fullFow: init(false),
    movePlayerOnTokenChange: init(false),
    spawnLocations: init([]),
    useGrid: init(false),
    unitSize: init(5), // gridSize computed is not triggering on setDefault for some reason
    unitSizeUnit: init("ft"),
    visionMaxRange: init(0),
    visionMinRange: init(0),
    visionMode: init(""),

    airMapBackground: init("none"),
    groundMapBackground: init("none"),
    undergroundMapBackground: init("none"),
});

function getOption<T>(key: WithLocationDefault<T>, location: number | undefined): WithDefault<T> {
    if (location === undefined) return { value: key.default, default: key.default };
    const override = key.location[location];
    return { value: override ?? key.default, override, default: key.default };
}

export const locationSettingsState = {
    ...state,
    getOption,
};

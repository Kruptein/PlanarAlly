import { GridType } from "../../../../core/grid";
import { buildState } from "../../../../core/systems/state";

import type { LocationOptions, WithDefault, WithLocationDefault } from "./models";

const init = <T>(x: T): WithLocationDefault<T> => ({ default: x, location: {}, value: x });

type State = { activeLocation: number } & { [key in keyof LocationOptions]: WithLocationDefault<LocationOptions[key]> };

function getInitState(): State {
    return {
        activeLocation: 0,

        fowLos: init(false),
        fowOpacity: init(0),
        gridType: init(GridType.Square),
        fullFow: init(false),
        movePlayerOnTokenChange: init(false),
        spawnLocations: init([]),
        useGrid: init(false),
        unitSize: init(5), // gridSize computed is not triggering on setDefault for some reason
        unitSizeUnit: init("ft"),
        visionMaxRange: init(0),
        visionMinRange: init(0),
        visionMode: init(""),
        limitMovementDuringInitiative: init(false),
        dropRatio: init(1),

        airMapBackground: init("none"),
        groundMapBackground: init("none"),
        undergroundMapBackground: init("none"),
    };
}

const state = buildState<State>(getInitState());

function getOption<T>(key: WithLocationDefault<T>, location: number | undefined): WithDefault<T> {
    if (location === undefined) return { value: key.default, default: key.default };
    const override = key.location[location];
    return { value: override ?? key.default, override, default: key.default };
}

export const locationSettingsState = {
    ...state,
    getOption,
    reset: () => {
        const i = getInitState();
        for (const key of Object.keys(i)) {
            const a = key as keyof State;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            state.mutableReactive[a] = i[a] as any; // typing cannot infer Key<>Value relation per key
        }
    },
};

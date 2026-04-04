import { PlayerInfoCore } from "../../../apiTypes";
import { buildState } from "../../../core/systems/state";
import type { ServerUserLocationOptions } from "../../models/settings";

import type { PlayerId } from "./models";

interface PlayerState {
    players: Map<PlayerId, PlayerInfoCore>;
    playerLocation: Map<PlayerId, ServerUserLocationOptions>;
}

const state = buildState<PlayerState>({
    players: new Map(),
    playerLocation: new Map(),
});

export const playerState = {
    ...state,
};

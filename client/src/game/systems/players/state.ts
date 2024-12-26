import { buildState } from "../../../core/systems/state";
import type { ServerUserLocationOptions } from "../../models/settings";

import type { Player, PlayerId } from "./models";

interface PlayerState {
    players: Map<PlayerId, Player>;
    playerLocation: Map<PlayerId, ServerUserLocationOptions>;
}

const state = buildState<PlayerState>({
    players: new Map(),
    playerLocation: new Map(),
});

export const playerState = {
    ...state,
};

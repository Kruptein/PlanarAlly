import type { Player } from "../../models/player";
import { buildState } from "../state";

interface PlayerState {
    players: Player[];
}

const state = buildState<PlayerState>({
    players: [],
});

export const playerState = {
    ...state,
};

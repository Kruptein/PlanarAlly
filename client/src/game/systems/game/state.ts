import { computed } from "vue";

import { buildState } from "../../../core/systems/state";

interface GameState {
    isConnected: boolean;
    boardInitialized: boolean;

    isDm: boolean;
    isFakePlayer: boolean;

    roomName: string;
    roomCreator: string;
    invitationCode: string;
    clientUrl: string;
    isLocked: boolean;
}

const state = buildState<GameState>({
    isConnected: false,
    boardInitialized: false,

    isDm: false,
    isFakePlayer: false,

    roomName: "",
    roomCreator: "",
    invitationCode: "",
    clientUrl: window.location.host,
    isLocked: false,
});

export const gameState = {
    ...state,
    isDmOrFake: computed(() => state.reactive.isDm || state.reactive.isFakePlayer),
};

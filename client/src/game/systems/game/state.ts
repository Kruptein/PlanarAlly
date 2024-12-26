import { computed } from "vue";

import type { AssetListMap } from "../../../core/models/types";
import { buildState } from "../../../core/systems/state";

interface GameState {
    isConnected: boolean;
    boardInitialized: boolean;

    isDm: boolean;
    isFakePlayer: boolean;

    roomName: string;
    roomCreator: string;
    invitationCode: string;
    publicName: string;
    isLocked: boolean;

    assets: AssetListMap;
}

const state = buildState<GameState>({
    isConnected: false,
    boardInitialized: false,

    isDm: false,
    isFakePlayer: false,

    roomName: "",
    roomCreator: "",
    invitationCode: "",
    publicName: window.location.host,
    isLocked: false,

    assets: new Map(),
});

export const gameState = {
    ...state,
    isDmOrFake: computed(() => state.reactive.isDm || state.reactive.isFakePlayer),
};

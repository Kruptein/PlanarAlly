import { buildState } from "../../../core/systems/state";

interface ReactiveChatState {
    enableChat: boolean;
    enableDice: boolean;
}

const state = buildState<ReactiveChatState>({
    enableChat: false,
    enableDice: false,
});

export const roomState = {
    ...state,
};

import { buildState } from "../state";

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

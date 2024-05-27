import { buildState } from "../state";

import type { ChatMessage } from "./models";

interface ReactiveChatState {
    messages: ChatMessage[];
}

const state = buildState<ReactiveChatState>({
    messages: [],
});

export const chatState = {
    ...state,
};

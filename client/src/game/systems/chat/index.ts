import { type System, registerSystem } from "..";
import type { SystemClearReason } from "../models";

import { sendChatMessage } from "./emits";
import { loadChatImages } from "./image-loader";
import { chatMarkDown } from "./md";
import { chatState } from "./state";

const { mutableReactive: $ } = chatState;

class ChatSystem implements System {
    clear(reason: SystemClearReason): void {
        if (reason === "full-loading") $.messages = [];
    }

    addMessage(author: string, data: string[], sync: boolean): void {
        const message = {
            author,
            content: chatMarkDown.render(data.join("")),
        };

        if (sync) sendChatMessage({ author, data });

        const messageIndex = $.messages.push(message) - 1;

        // Non-blocking on purpose
        loadChatImages(data, messageIndex).catch((err) => console.log("failed to load images", err));
    }
}

export const chatSystem = new ChatSystem();
registerSystem("chat", chatSystem, false, chatState);

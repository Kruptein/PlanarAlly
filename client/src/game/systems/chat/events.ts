import type { ApiChatMessageUpdate, ApiChatMessage } from "../../../apiTypes";
import { socket } from "../../api/socket";

import { chatSystem } from ".";

socket.on("Chat.Add", (data: ApiChatMessage) => {
    chatSystem.addMessage(data.id, data.author, data.data, false);
});

socket.on("Chat.Message.Update", (data: ApiChatMessageUpdate) => {
    chatSystem.updateImage(data.id, data.message);
});

import type { ApiChatMessage } from "../../../apiTypes";
import { socket } from "../../api/socket";

import { chatSystem } from ".";

socket.on("Chat.Add", (data: ApiChatMessage) => {
    chatSystem.addMessage(data.author, data.data, false);
});

import type { ApiChatMessage } from "../../../apiTypes";
import { wrapSocket } from "../../api/socket";

export const sendChatMessage = wrapSocket<ApiChatMessage>("Chat.Add");

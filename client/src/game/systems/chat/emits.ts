import type { ApiChatMessage } from "../../../apiTypes";
import { wrapSocket } from "../../api/helpers";

export const sendChatMessage = wrapSocket<ApiChatMessage>("Chat.Add");

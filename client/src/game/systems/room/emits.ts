import { wrapSocket } from "../../api/socket";

export const sendSetChatFeature = wrapSocket<boolean>("Room.Features.Chat.Set");
export const sendSetDiceFeature = wrapSocket<boolean>("Room.Features.Dice.Set");

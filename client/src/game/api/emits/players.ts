import type { PlayerRoleSet, PlayerPosition, PlayersPositionSet } from "../../../apiTypes";
import { wrapSocket } from "../socket";

export const sendBringPlayers = wrapSocket<PlayerPosition>("Players.Bring");
export const sendSetPlayersPosition = wrapSocket<PlayersPositionSet>("Players.Position.Set");

export const sendChangePlayerRole = wrapSocket<PlayerRoleSet>("Player.Role.Set");

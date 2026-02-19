import type { PlayerRoleSet, PlayersPositionSet, PositionTupleWithFloor } from "../../../apiTypes";
import { wrapSocket } from "../socket";

export const sendBringPlayers = wrapSocket<PositionTupleWithFloor>("Players.Bring");
export const sendSetPlayersPosition = wrapSocket<PlayersPositionSet>("Players.Position.Set");

export const sendChangePlayerRole = wrapSocket<PlayerRoleSet>("Player.Role.Set");

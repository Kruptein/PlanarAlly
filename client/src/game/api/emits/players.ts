import type { PlayerRoleSet, PlayerPosition } from "../../../apiTypes";
import { wrapSocket } from "../helpers";

export const sendBringPlayers = wrapSocket<PlayerPosition>("Players.Bring");

export const sendChangePlayerRole = wrapSocket<PlayerRoleSet>("Player.Role.Set");

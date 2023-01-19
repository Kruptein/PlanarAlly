import type { PlayerRoleSet, PlayersBring } from "../../../apiTypes";
import { wrapSocket } from "../helpers";

export const sendBringPlayers = wrapSocket<PlayersBring>("Players.Bring");

export const sendChangePlayerRole = wrapSocket<PlayerRoleSet>("Player.Role.Set");

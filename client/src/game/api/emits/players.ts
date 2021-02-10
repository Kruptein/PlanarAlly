import { wrapSocket } from "../helpers";

export const sendBringPlayers = wrapSocket<{ floor: string; x: number; y: number; zoom: number }>("Players.Bring");

export const sendChangePlayerRole = wrapSocket<{ player: number; role: number }>("Player.Role.Set");

import { socket } from "../socket";
import { wrapSocket } from "../helpers";

export const sendBringPlayers = wrapSocket<{ floor: string; x: number; y: number; zoom: number }>("Players.Bring");

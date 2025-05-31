import type { DiceRollResult } from "../../../apiTypes";
import { wrapSocket } from "../../api/socket";

export const sendDiceRollResult = wrapSocket<DiceRollResult>("Dice.Roll.Result");

import type { DiceRollResult } from "../../../apiTypes";
import { wrapSocket } from "../helpers";

export const sendDiceRollResult = wrapSocket<DiceRollResult>("Dice.Roll.Result");

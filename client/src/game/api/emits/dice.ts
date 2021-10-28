import type { DiceResult } from "../../models/dice";
import { wrapSocket } from "../helpers";

export const sendDiceRollResult = wrapSocket<DiceResult>("Dice.Roll.Result");

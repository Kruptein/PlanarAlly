import type { DiceRollResult } from "../../../apiTypes";
import { wrapSocket } from "../../api/helpers";

export const sendDiceRollResult = wrapSocket<DiceRollResult>("Dice.Roll.Result");

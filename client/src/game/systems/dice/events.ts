import type { Part, RollResult } from "@planarally/dice/core";

import type { DiceRollResult } from "../../../apiTypes";
import { socket } from "../../api/socket";

import { diceSystem } from ".";

socket.on("Dice.Roll.Result", (data: DiceRollResult) => {
    const roll = JSON.parse(data.roll) as RollResult<Part>;
    const rollString = diceSystem.addToHistory(
        roll,
        data.player,
        data.input === undefined || data.input === null ? undefined : { display: data.input },
    );

    diceSystem.showRollToast(data.player, rollString, roll);
});

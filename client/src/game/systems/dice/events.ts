import type { Part, RollResult } from "@planarally/dice/core";
import { POSITION, useToast } from "vue-toastification";

import type { DiceRollResult } from "../../../apiTypes";
import { socket } from "../../api/socket";

import { diceSystem } from ".";

const toast = useToast();

socket.on("Dice.Roll.Result", (data: DiceRollResult) => {
    const roll = JSON.parse(data.roll) as RollResult<Part>;
    const rollString = diceSystem.addToHistory(roll, data.player);

    toast.info(`${data.player} rolled ${rollString} and threw a ${roll.result}`, {
        position: POSITION.TOP_RIGHT,
        onClick: () => diceSystem.showResults(roll),
    });
});

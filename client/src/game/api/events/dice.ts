import { POSITION, useToast } from "vue-toastification";

import type { DiceResult } from "../../models/dice";
import { diceTool } from "../../tools/variants/dice";
import { socket } from "../socket";

const toast = useToast();

socket.on("Dice.Roll.Result", (data: DiceResult) => {
    toast.info(`${data.player} threw a ${data.result}`, {
        position: POSITION.TOP_RIGHT,
    });
    diceTool.state.history.push(data);
});

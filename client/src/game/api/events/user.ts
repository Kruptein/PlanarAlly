import { colourHistory } from "../../../core/components/store";
import { socket } from "../socket";

socket.on("User.ColourHistory.Set", (data: string) => {
    colourHistory.value = JSON.parse(data);
});

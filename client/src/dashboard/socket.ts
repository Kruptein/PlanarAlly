import { baseAdjust } from "../core/http";
import { socketManager } from "../core/socket";

export const socket = socketManager.socket("/dashboard");
if (!socket.connected) socket.connect();

socket.on("Campaign.Export.Done", (filename: string) => {
    window.open(baseAdjust(`/static/temp/${filename}.pac`));
});

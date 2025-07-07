import { socketManager } from "../core/socket";

// import { dashboardState } from "./state";

export const socket = socketManager.socket("/admin");

socket.on("disconnect", (reason: string) => {
    console.log("[Admin] disconnected");
    if (reason === "io server disconnect") socket.open();
});

import { socketManager } from "../core/socket";
import { router } from "../router";

export const socket = socketManager.socket("/admin");

socket.on("disconnect", async () => {
    console.log("[Admin] disconnected");
    await router.push("/dashboard");
});

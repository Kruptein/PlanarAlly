import { POSITION, useToast } from "vue-toastification";

import { logicStore } from "../../../store/logic";
import { socket } from "../socket";

const toast = useToast();

socket.on("Logic.Door.Request", (data: { shape: string; requester: string }) => {
    toast.info("Request to open door", {
        timeout: 30_000,
        position: POSITION.TOP_RIGHT,
        onClick: () => logicStore.handleRequest(data),
    });
});

socket.on("Logic.Door.Request.Declined", () => {
    toast.error("Request to open door declined by DM", {
        position: POSITION.TOP_RIGHT,
    });
});

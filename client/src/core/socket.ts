import { Manager } from "socket.io-client";

export function createNewManager(): Manager {
    return new Manager(location.protocol + "//" + location.host, {
        autoConnect: false,
        path: import.meta.env.BASE_URL + "socket.io",
        transports: ["websocket", "polling"],
    });
}

export const socketManager = createNewManager();

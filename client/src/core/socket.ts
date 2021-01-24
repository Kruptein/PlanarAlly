import { Manager } from "socket.io-client";

import { BASE_PATH } from "../utils";

export function createNewManager(): Manager {
    return new Manager(location.protocol + "//" + location.host, {
        autoConnect: false,
        path: BASE_PATH + "socket.io",
        transports: ["websocket", "polling"],
    });
}

export const socketManager = createNewManager();

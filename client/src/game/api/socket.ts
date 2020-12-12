import { Manager } from "socket.io-client";
import { Route } from "vue-router";
import { BASE_PATH } from "../../utils";

const manager = new Manager(location.protocol + "//" + location.host, {
    autoConnect: false,
    path: BASE_PATH + "socket.io",
    transports: ["websocket", "polling"],
});

export const socket = manager.socket("/planarally");

export function createConnection(route: Route): void {
    // since socket.io v3 this is private, couldn't find an immediate 'clean' fix
    (socket.io as any).opts.query = `user=${decodeURIComponent(route.params.creator)}&room=${decodeURIComponent(
        route.params.room,
    )}`;
    socket.connect();
}

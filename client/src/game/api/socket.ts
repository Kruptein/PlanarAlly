import io from "socket.io-client";
import { Route } from "vue-router";

export const socket = io(location.protocol + "//" + location.host + "/planarally", {
    autoConnect: false,
    path: process.env.BASE_URL + "socket.io",
    transports: ["websocket", "polling"],
});

export function createConnection(route: Route): void {
    socket.io.opts.query = `user=${decodeURIComponent(route.params.creator)}&room=${decodeURIComponent(
        route.params.room,
    )}`;
    socket.io.opts.transports = ["websocket", "polling"];
    socket.connect();
}

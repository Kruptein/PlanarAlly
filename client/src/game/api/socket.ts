import io from "socket.io-client";
import { Route } from "vue-router";

export const socket = io(location.protocol + "//" + location.host + "/planarally", { autoConnect: false });

export function createConnection(route: Route) {
    socket.io.opts.query = `user=${decodeURIComponent(route.params.creator)}&room=${decodeURIComponent(
        route.params.room,
    )}`;
    socket.connect();
}

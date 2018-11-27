import io from "socket.io-client";
import { Route } from "vue-router";

const socket = io(location.protocol + "//" + location.host + "/planarally", { autoConnect: false });

export function createConnection(route: Route) {
    socket.io.opts.query = `user=${route.params.creator}&room=${route.params.room}`;
    socket.connect();
}

export default socket;

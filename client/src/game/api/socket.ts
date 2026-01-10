import type { RouteLocationNormalized } from "vue-router";

import { createNewManager, generateSocketHelpers } from "../../core/socket";
import type { ClientId } from "../systems/client/models";
// import { debugInfo } from "../ui/debug";

export const socket = createNewManager().socket("/planarally");

export function createConnection(route: RouteLocationNormalized): void {
    socket.io.opts.query = {
        user: decodeURIComponent(route.params.creator as string),
        room: decodeURIComponent(route.params.room as string),
    };
    socket.connect();
}

export function getClientId(): ClientId {
    return socket.id as ClientId;
}

export const { wrapSocket, wrapSocketWithDataAck } = generateSocketHelpers(socket);

// setInterval(() => {
//     const start = performance.now();
//     socket.emit("ping", () => {
//         debugInfo.addSocketLatency(performance.now() - start);
//     });
// }, 1000);

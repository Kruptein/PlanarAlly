import type { RouteLocationNormalized } from "vue-router";

import { createNewManager } from "../../core/socket";
import type { ClientId } from "../systems/client/models";
// import { debugInfo } from "../ui/debug";

export const socket = createNewManager().socket("/planarally");

export function createConnection(route: RouteLocationNormalized): void {
    // since socket.io v3 this is private, couldn't find an immediate 'clean' fix
    (socket.io as any).opts.query = `user=${decodeURIComponent(
        route.params.creator as string,
    )}&room=${decodeURIComponent(route.params.room as string)}`;
    socket.connect();
}

export function getClientId(): ClientId {
    return socket.id as ClientId;
}

// setInterval(() => {
//     const start = performance.now();
//     socket.emit("ping", () => {
//         debugInfo.addSocketLatency(performance.now() - start);
//     });
// }, 1000);

import type { RouteParams } from "vue-router";

import { createNewManager } from "../../../core/socket";
import type { ClientId } from "../systems/client/models";
// import { debugInfo } from "../ui/debug";

export const socket = createNewManager().socket("/planarally");

export function createConnection(params: RouteParams): void {
    socket.io.opts.query = {
        user: decodeURIComponent(params.creator as string),
        room: decodeURIComponent(params.room as string),
    };
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

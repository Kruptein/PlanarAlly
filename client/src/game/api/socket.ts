import { RouteLocationNormalized } from "vue-router";

import { socketManager } from "../../core/socket";

export const socket = socketManager.socket("/planarally");

export function createConnection(route: RouteLocationNormalized): void {
    // since socket.io v3 this is private, couldn't find an immediate 'clean' fix
    (socket.io as any).opts.query = `user=${decodeURIComponent(
        route.params.creator as string,
    )}&room=${decodeURIComponent(route.params.room as string)}`;
    socket.connect();
}

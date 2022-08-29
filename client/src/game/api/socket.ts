import type { RouteLocationNormalized } from "vue-router";

import { createNewManager } from "../../core/socket";
import type { ClientId } from "../systems/client/models";

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

// Core socket startup logic
// It is ESSENTIAL that this file is only imported in the main running context. (i.e. a webworker or the main thread)

import type { RouteParams } from "vue-router";

import "../core/api/events";

import { createConnection, socket } from "./api/socket";

export function startGame(data: { params: RouteParams }): void {
    createConnection(data.params);
}

export function stopGame(): void {
    socket.disconnect();
}

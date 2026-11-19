import { useIdle } from "@vueuse/core";
import { onUnmounted, watch } from "vue";

import { sendIdleState } from "./api/emits/client";
import { socket } from "./api/socket";

// The server leaves this time out of the session when it is told the client is idle,
// so it has to match IDLE_TIMEOUT in the server's stats events.
const IDLE_TIMEOUT = 30 * 60 * 1000;

/**
 * Reports to the server when the user hasn't interacted with the game for a while (e.g. a forgotten tab),
 * so that this time doesn't count towards the game session stats.
 */
export function useIdleReporting(): void {
    const { idle } = useIdle(IDLE_TIMEOUT);

    watch(idle, (isIdle) => sendIdleState(isIdle));

    // The server starts every new connection as active
    function onConnect(): void {
        if (idle.value) sendIdleState(true);
    }
    socket.on("connect", onConnect);
    onUnmounted(() => socket.off("connect", onConnect));
}

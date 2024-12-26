import type { DeepReadonly } from "vue";

import type { ClientPosition } from "../../../apiTypes";
import { registerSystem } from "../../../core/systems";
import type { System } from "../../../core/systems";
import type { SystemClearReason } from "../../../core/systems/models";
import { getLocalStorageObject } from "../../../localStorageHelpers";
import { router } from "../../../router";
import { coreStore } from "../../../store/core";
import { sendLocationChange } from "../../api/emits/location";
import { sendChangePlayerRole } from "../../api/emits/players";
import { sendRoomKickPlayer } from "../../api/emits/room";
import { getClientId } from "../../api/socket";
import { Role } from "../../models/role";
import type { ServerUserLocationOptions } from "../../models/settings";
import { startDrawLoop } from "../../rendering/core";
import { clientSystem } from "../client";
import { clientState } from "../client/state";
import { floorSystem } from "../floors";
import { positionSystem } from "../position";

import type { Player, PlayerId } from "./models";
import { playerState } from "./state";

const { mutableReactive: $, raw } = playerState;

class PlayerSystem implements System {
    clear(reason: SystemClearReason): void {
        if (reason !== "partial-loading") $.players.clear();
    }

    addPlayer(player: Player): void {
        $.players.set(player.id, player);
    }

    getPosition(player: PlayerId): DeepReadonly<ServerUserLocationOptions> | undefined {
        return $.playerLocation.get(player);
    }

    setPosition(player: PlayerId, position: ClientPosition): void {
        $.playerLocation.set(player, position);
        clientSystem.updatePlayerRect(player);
    }

    updatePlayersLocation(
        players: string[],
        location: number,
        sync: boolean,
        targetPosition?: { x: number; y: number },
    ): void {
        for (const player of $.players.values()) {
            if (players.includes(player.name)) {
                player.location = location;
            }
        }
        if (sync) sendLocationChange({ location, users: players, position: targetPosition });
    }

    kickPlayer(playerId: PlayerId): void {
        const player = this.getPlayer(playerId);
        if (player === undefined) return;

        if (player.name === router.currentRoute.value.params.creator && coreStore.state.username !== player.name) {
            return;
        }

        sendRoomKickPlayer(playerId);
        $.players.delete(playerId);
        $.playerLocation.delete(playerId);
    }

    setPlayerRole(playerId: PlayerId, role: Role, sync: boolean): void {
        const player = this.getPlayer(playerId);
        if (player === undefined) return;

        // Only the creator can demote themselves
        if (player.name === router.currentRoute.value.params.creator && coreStore.state.username !== player.name) {
            return;
        }

        // Prevent the last DM role from being removed
        if (
            player.role === Role.DM &&
            role !== Role.DM &&
            ![...raw.players.values()].some((p) => p.id !== playerId && p.role === Role.DM)
        ) {
            return;
        }

        player.role = role;
        if (sync) sendChangePlayerRole({ player: playerId, role });
    }

    setShowPlayerRect(playerId: PlayerId, showPlayerRect: boolean): void {
        const player = this.getPlayer(playerId);
        if (player === undefined) return;

        player.showRect = showPlayerRect;

        for (const [clientId, player] of clientState.raw.clientIds.entries()) {
            if (playerId === player) clientSystem.showClientRect(clientId, showPlayerRect);
        }
    }

    getPlayer(playerId: PlayerId): Player | undefined {
        return $.players.get(playerId);
    }

    // the following 2 functions should be cached..
    getCurrentPlayerId(): PlayerId | undefined {
        for (const player of raw.players.values()) {
            if (player.name === coreStore.state.username) {
                return player.id;
            }
        }
    }

    getCurrentPlayer(): Player | undefined {
        for (const player of raw.players.values()) {
            if (player.name === coreStore.state.username) {
                return player;
            }
        }
    }

    loadPosition(): void {
        const position = $.playerLocation.get(this.getCurrentPlayer()!.id)!;
        positionSystem.setZoomDisplay(position.zoom_display, { invalidate: true, updateSectors: false, sync: false });
        positionSystem.setPan(position.pan_x, position.pan_y, { updateSectors: true });
        if (position.active_layer !== undefined) floorSystem.selectLayer(position.active_layer, false);
        const offset = getLocalStorageObject("PA_OFFSET") as { x?: number; y?: number } | undefined;
        clientSystem.initViewport();
        if (offset !== undefined) clientSystem.setOffset(getClientId(), offset, false);
        clientSystem.sendViewportInfo();
        clientSystem.updateAllClientRects();
        // then we can start the draw loop
        startDrawLoop();
    }
}

export const playerSystem = new PlayerSystem();
registerSystem("players", playerSystem, false, playerState);

import type { DeepReadonly } from "vue";

import { registerSystem } from "..";
import type { System } from "..";
import { router } from "../../../router";
import { coreStore } from "../../../store/core";
import { sendLocationChange } from "../../api/emits/location";
import { sendChangePlayerRole } from "../../api/emits/players";
import { sendRoomKickPlayer } from "../../api/emits/room";
import type { ServerUserLocationOptions } from "../../models/settings";
import { clientSystem } from "../client";
import { clientState } from "../client/state";

import type { Player, PlayerId } from "./models";
import { playerState } from "./state";

const { mutableReactive: $ } = playerState;

class PlayerSystem implements System {
    clear(partial: boolean): void {
        if (!partial) $.players.clear();
    }

    addPlayer(player: Player): void {
        $.players.set(player.id, player);
    }

    getPosition(player: PlayerId): DeepReadonly<ServerUserLocationOptions> | undefined {
        return $.playerLocation.get(player);
    }

    setPosition(player: PlayerId, position: ServerUserLocationOptions): void {
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

    setPlayerRole(playerId: PlayerId, role: number, sync: boolean): void {
        const player = this.getPlayer(playerId);
        if (player === undefined) return;

        if (player.name === router.currentRoute.value.params.creator && coreStore.state.username !== player.name) {
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

    getCurrentPlayer(): Player {
        for (const player of $.players.values()) {
            if (player.name === coreStore.state.username) {
                return player;
            }
        }
        throw new Error("Current player does not exist");
    }
}

export const playerSystem = new PlayerSystem();
registerSystem("players", playerSystem, false);

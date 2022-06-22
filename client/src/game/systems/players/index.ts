import { registerSystem } from "..";
import type { System } from "..";
import { router } from "../../../router";
import { coreStore } from "../../../store/core";
import { sendLocationChange } from "../../api/emits/location";
import { sendChangePlayerRole } from "../../api/emits/players";
import { sendRoomKickPlayer } from "../../api/emits/room";
import type { Player } from "../../models/player";
import { clientSystem } from "../client";

import { playerState } from "./state";

const { _$ } = playerState;

class PlayerSystem implements System {
    clear(): void {
        _$.players = [];
    }

    setPlayers(players: Player[]): void {
        _$.players = players;
    }

    addPlayer(player: Player): void {
        _$.players.push(player);
    }

    updatePlayersLocation(
        players: string[],
        location: number,
        sync: boolean,
        targetPosition?: { x: number; y: number },
    ): void {
        for (const player of _$.players) {
            if (players.includes(player.name)) {
                player.location = location;
            }
        }
        _$.players = [..._$.players];
        if (sync) sendLocationChange({ location, users: players, position: targetPosition });
    }

    kickPlayer(playerId: number): void {
        const player = _$.players.find((p) => p.id === playerId);
        if (player === undefined) return;

        if (player.name === router.currentRoute.value.params.creator && coreStore.state.username !== player.name) {
            return;
        }

        sendRoomKickPlayer(playerId);
        _$.players = _$.players.filter((p) => p.id !== playerId);
    }

    setPlayerRole(playerId: number, role: number, sync: boolean): void {
        const player = _$.players.find((p) => p.id === playerId);
        if (player === undefined) return;

        if (player.name === router.currentRoute.value.params.creator && coreStore.state.username !== player.name) {
            return;
        }

        player.role = role;
        if (sync) sendChangePlayerRole({ player: playerId, role });
    }

    setShowPlayerRect(playerId: number, showPlayerRect: boolean): void {
        const player = _$.players.find((p) => p.id === playerId);
        if (player === undefined) return;

        player.showRect = showPlayerRect;
        clientSystem.showClientRect(playerId, showPlayerRect);
    }
}

export const playerSystem = new PlayerSystem();
registerSystem("players", playerSystem, false);

import { registerSystem } from "../../../core/systems";
import type { System } from "../../../core/systems";
import { sendRoomLock } from "../../api/emits/room";
import { updateFogColour } from "../../colour";
import { floorSystem } from "../floors";

import { gameState } from "./state";

const { mutableReactive: $ } = gameState;

class GameSystem implements System {
    clear(): void {
        $.boardInitialized = false;
    }

    setConnected(connected: boolean): void {
        $.isConnected = connected;
    }

    setBoardInitialized(initialized: boolean): void {
        $.boardInitialized = initialized;
    }

    setDm(isDm: boolean): void {
        $.isDm = isDm;
        updateFogColour();
    }

    setFakePlayer(isFakePlayer: boolean): void {
        $.isFakePlayer = isFakePlayer;
        this.setDm(!isFakePlayer);
        floorSystem.invalidateAllFloors();
    }

    setRoomName(name: string): void {
        $.roomName = name;
    }

    setRoomCreator(creator: string): void {
        $.roomCreator = creator;
    }

    setInvitationCode(invitationCode: string): void {
        $.invitationCode = invitationCode;
    }

    setPublicName(name: string): void {
        if (!name.length) return;
        $.publicName = name;
    }

    setIsLocked(isLocked: boolean, sync: boolean): void {
        $.isLocked = isLocked;
        if (sync) sendRoomLock(isLocked);
    }
}

export const gameSystem = new GameSystem();
registerSystem("game", gameSystem, false, gameState);

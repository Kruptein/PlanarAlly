import { type System, registerSystem } from "../../../core/systems";

import { sendSetChatFeature, sendSetDiceFeature } from "./emits";
import { roomState } from "./state";

const { mutableReactive: $ } = roomState;

class RoomSystem implements System {
    clear(): void {}

    setChat(enabled: boolean, sync: boolean): void {
        $.enableChat = enabled;
        if (sync) {
            sendSetChatFeature(enabled);
        }
    }

    setDice(enabled: boolean, sync: boolean): void {
        $.enableDice = enabled;
        if (sync) {
            sendSetDiceFeature(enabled);
        }
    }
}

export const roomSystem = new RoomSystem();
registerSystem("room", roomSystem, false, roomState);

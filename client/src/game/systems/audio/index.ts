import { type System, registerSystem } from "..";
import type { SystemClearReason } from "../models";

import { sendPlayCommand } from "./emits";
import { sendStopCommand } from "./emits";
import { toggleLoopCommand } from "./emits";

// import  MenuBar  from "../../ui/menu/MenuBar.vue";
import { audioService } from "../../ui/menu/audioService";

class AudioSystem implements System {
    clear(reason: SystemClearReason): void {
    }
    
    PlayAudioForRoom(action: string, fileName: string): void {
        sendPlayCommand({ action, fileName});
    }

    StopAudioForRoom(action: string): void {
        sendStopCommand({ action, fileName: ""});
    }

    ToggleLoopAudioForRoom(action: string): void {
        toggleLoopCommand({ action, fileName: ""});
    }

    StartPlayback(action: string, fileName: string): void {
        audioService.startPlayback(fileName);
    }
    StopPlayback(action: string, fileName: string): void {
        audioService.stopPlayback();
    }
    ToggleLoopPlayback(action: string, fileName: string): void {
        audioService.toggleLoopPlayback();
    }
}

export const audioSystem = new AudioSystem();
registerSystem("audio", audioSystem, false);

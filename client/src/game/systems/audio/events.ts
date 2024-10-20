import type {  ApiAudioMessage } from "../../../apiTypes";
import { socket } from "../../api/socket";

import { audioSystem } from ".";

socket.on("Audio.Play", (data: ApiAudioMessage) => {
    audioSystem.StartPlayback(data.action, data.fileName);
});
socket.on("Audio.Stop", (data: ApiAudioMessage) => {
    audioSystem.StopPlayback(data.action, data.fileName);
});
socket.on("Audio.ToggleLoop", (data: ApiAudioMessage) => {
    audioSystem.ToggleLoopPlayback(data.action, data.fileName);
});
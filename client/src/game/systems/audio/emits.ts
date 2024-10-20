import type { ApiAudioMessage } from "../../../apiTypes";
import { wrapSocket } from "../../api/helpers";

export const sendPlayCommand = wrapSocket<ApiAudioMessage>("Audio.Play");
export const sendStopCommand = wrapSocket<ApiAudioMessage>("Audio.Stop");
export const toggleLoopCommand = wrapSocket<ApiAudioMessage>("Audio.ToggleLoop");
import { useToast } from "vue-toastification";

import { baseAdjust } from "../core/http";
import { socketManager } from "../core/socket";

import { dashboardState } from "./state";

const toast = useToast();

export const socket = socketManager.socket("/dashboard");

socket.on("Campaign.Export.Done", (filename: string) => {
    window.open(baseAdjust(`/static/temp/${filename}.pac`));
});

socket.on("Campaign.Import.Chunk", (chunk: number) => dashboardState.chunksProcessed.add(chunk));

socket.on("Campaign.Import.Done", () => toast.info("A campaign import just finished!"));

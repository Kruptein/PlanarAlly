import { useToast } from "vue-toastification";

import { baseAdjust } from "../core/http";
import { socketManager } from "../core/socket";

import { dashboardState } from "./state";

const toast = useToast();

export const socket = socketManager.socket("/dashboard");

socket.on("disconnect", () => {
    dashboardState.adminEnabled = false;
});

socket.on("Campaign.Export.Done", (filename: string) => {
    window.open(baseAdjust(`/static/temp/${filename}.pac`));
});

socket.on("Campaign.Import.Chunk", (chunk: number) => dashboardState.chunksProcessed.add(chunk));

socket.on("Campaign.Import.Done", (data: { success: true } | { success: false; reason: string }) => {
    if (data.success) {
        toast.info("A campaign import just finished!");
    } else {
        toast.error(`Something went wrong with the campaign import :( (${data.reason})`, { timeout: false });
    }
});

socket.on("Admin.Enabled", (enabled: boolean) => {
    dashboardState.adminEnabled = enabled;
});

import { useToast } from "vue-toastification";

import type { ApiDevModsUpdate, ApiModLink, ApiModReplace } from "../../../apiTypes";
import { loadedModId, replaceRoomMod, syncDevMods, unloadMod } from "../../../mods";
import { socket } from "../socket";

const toast = useToast();

socket.on("Mods.Room.Replaced", (data: ApiModReplace) => {
    replaceRoomMod(data.mod).catch((error: unknown) => {
        console.error("Failed to replace mod", data.mod.tag, error);
        toast.error(`Failed to load mod ${data.mod.tag}`, { timeout: false });
    });
});

socket.on("Mods.Room.Removed", (data: ApiModLink) => {
    unloadMod(loadedModId(data)).catch((error: unknown) => {
        console.error("Failed to unload mod", data.tag, error);
    });
});

socket.on("Mods.Dev.Updated", (data: ApiDevModsUpdate) => {
    syncDevMods(data.mods, data.force ?? false).catch((error: unknown) => {
        console.error("Failed to reload dev mods", error);
        toast.error("Failed to reload dev mods", { timeout: false });
    });
});

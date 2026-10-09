import { useToast } from "vue-toastification";

import type {
    ApiDevModsActiveState,
    ApiDevModsUpdate,
    ApiModEnabled,
    ApiModLink,
    ApiModReplace,
} from "../../../apiTypes";
import { applyDevModActiveState, forgetRoomMod, replaceRoomMod, setRoomModEnabled, syncDevMods } from "../../../mods";
import { socket } from "../socket";

const toast = useToast();

socket.on("Mods.Room.Replaced", (data: ApiModReplace) => {
    replaceRoomMod(data.mod).catch((error: unknown) => {
        console.error("Failed to replace mod", data.mod.tag, error);
        toast.error(`Failed to load mod ${data.mod.tag}`, { timeout: false });
    });
});

socket.on("Mods.Room.Removed", (data: ApiModLink) => {
    forgetRoomMod(data).catch((error: unknown) => {
        console.error("Failed to unload mod", data.tag, error);
    });
});

socket.on("Mods.Room.SetEnabled", (data: ApiModEnabled) => {
    setRoomModEnabled(data).catch((error: unknown) => {
        console.error("Failed to set mod enabled state", data.tag, error);
    });
});

socket.on("Mods.Dev.ActiveState.Set", (data: ApiDevModsActiveState) => {
    applyDevModActiveState(data.disabled).catch((error: unknown) => {
        console.error("Failed to apply dev mod state", error);
    });
});

socket.on("Mods.Dev.Updated", (data: ApiDevModsUpdate) => {
    syncDevMods(data.mods, data.force ?? false).catch((error: unknown) => {
        console.error("Failed to reload dev mods", error);
        toast.error("Failed to reload dev mods", { timeout: false });
    });
});

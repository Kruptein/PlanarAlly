import { EventBus } from "../../event-bus";
import { Role } from "../../models/role";
import { optionsToClient, ServerLocationOptions } from "../../models/settings";
import { gameSettingsStore } from "../../settings";
import { gameStore } from "../../store";
import { socket } from "../socket";

import { setLocationOptions } from "./location";

socket.on(
    "Room.Info.Set",
    (data: {
        name: string;
        creator: string;
        invitationCode: string;
        isLocked: boolean;
        default_options: ServerLocationOptions;
        players: { id: number; name: string; location: number; role: number }[];
    }) => {
        let found = false;
        for (const player of data.players) {
            if (player.name === gameStore.username) {
                found = true;
                gameStore.setDM(player.role === Role.DM);
            }
        }
        if (!found) {
            socket.disconnect();
            return;
        }

        gameStore.setRoomName(data.name);
        gameStore.setRoomCreator(data.creator);
        gameStore.setInvitationCode(data.invitationCode);
        gameStore.setIsLocked({ isLocked: data.isLocked, sync: false });
        gameStore.setPlayers(data.players);
        gameSettingsStore.setDefaultLocationOptions(optionsToClient(data.default_options));
        setLocationOptions(null, data.default_options);
    },
);

socket.on("Room.Info.InvitationCode.Set", (invitationCode: string) => {
    gameStore.setInvitationCode(invitationCode);
    EventBus.$emit("DmSettings.RefreshedInviteCode");
});

socket.on("Room.Info.Players.Add", (data: { id: number; name: string; location: number; role: number }) => {
    gameStore.addPlayer(data);
});

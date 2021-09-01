import { clientStore } from "../../../store/client";
import { gameStore } from "../../../store/game";
import { settingsStore } from "../../../store/settings";
import { Role } from "../../models/role";
import { optionsToClient } from "../../models/settings";
import type { ServerLocationOptions } from "../../models/settings";
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
        publicName: string;
    }) => {
        let found = false;
        for (const player of data.players) {
            if (player.name === clientStore.state.username) {
                found = true;
                gameStore.setDm(player.role === Role.DM);
            }
        }
        if (!found) {
            socket.disconnect();
            return;
        }

        gameStore.setRoomName(data.name);
        gameStore.setRoomCreator(data.creator);
        gameStore.setInvitationCode(data.invitationCode);
        gameStore.setIsLocked(data.isLocked, false);
        gameStore.setPlayers(data.players.map((p) => ({ ...p, showRect: false })));
        gameStore.setPublicName(data.publicName);
        settingsStore.setDefaultLocationOptions(optionsToClient(data.default_options));
        setLocationOptions(undefined, data.default_options);
    },
);

socket.on("Room.Info.InvitationCode.Set", (invitationCode: string) => {
    gameStore.setInvitationCode(invitationCode);
});

socket.on("Room.Info.Players.Add", (data: { id: number; name: string; location: number; role: number }) => {
    gameStore.addPlayer({ ...data, showRect: false });
});

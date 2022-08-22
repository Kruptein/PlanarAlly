import { gameStore } from "../../../store/game";
import { settingsStore } from "../../../store/settings";
import { optionsToClient } from "../../models/settings";
import type { ServerLocationOptions } from "../../models/settings";
import { playerSystem } from "../../systems/players";
import type { Player } from "../../systems/players/models";
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
        publicName: string;
    }) => {
        gameStore.setRoomName(data.name);
        gameStore.setRoomCreator(data.creator);
        gameStore.setInvitationCode(data.invitationCode);
        gameStore.setIsLocked(data.isLocked, false);
        gameStore.setPublicName(data.publicName);
        settingsStore.setDefaultLocationOptions(optionsToClient(data.default_options));
        setLocationOptions(undefined, data.default_options);
    },
);

socket.on("Room.Info.InvitationCode.Set", (invitationCode: string) => {
    gameStore.setInvitationCode(invitationCode);
});

socket.on("Room.Info.Players.Add", (data: Omit<Player, "showRect">) => {
    playerSystem.addPlayer({ ...data, showRect: false });
});

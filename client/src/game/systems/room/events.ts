import type { RoomInfoPlayersAdd, RoomInfoSet } from "../../../apiTypes";
import { loadRoomMods } from "../../../mods";
import { socket } from "../../api/socket";
import { Role } from "../../models/role";
import { gameSystem } from "../game";
import { playerSystem } from "../players";

import { roomSystem } from ".";

socket.on("Room.Info.Set", (data: RoomInfoSet) => {
    gameSystem.setRoomName(data.name);
    gameSystem.setRoomCreator(data.creator);
    gameSystem.setInvitationCode(data.invitationCode);
    gameSystem.setIsLocked(data.isLocked, false);
    gameSystem.setClientUrl(data.clientUrl);
    roomSystem.setChat(data.features.chat, false);
    roomSystem.setDice(data.features.dice, false);

    loadRoomMods(data.mods).catch(() => {
        console.error("Failed to initialize mods");
    });
});

socket.on("Room.Info.InvitationCode.Set", (invitationCode: string) => {
    gameSystem.setInvitationCode(invitationCode);
});

socket.on("Room.Info.Players.Add", (data: RoomInfoPlayersAdd) => {
    playerSystem.addPlayer({ ...data, role: Role.Player, showRect: false });
});

socket.on("Room.Features.Chat.Set", (data: boolean) => {
    roomSystem.setChat(data, false);
});

socket.on("Room.Features.Dice.Set", (data: boolean) => {
    roomSystem.setDice(data, false);
});

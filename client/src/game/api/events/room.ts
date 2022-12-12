import { gameStore } from "../../../store/game";
import { playerSystem } from "../../systems/players";
import type { Player } from "../../systems/players/models";
import { socket } from "../socket";

socket.on(
    "Room.Info.Set",
    (data: { name: string; creator: string; invitationCode: string; isLocked: boolean; publicName: string }) => {
        gameStore.setRoomName(data.name);
        gameStore.setRoomCreator(data.creator);
        gameStore.setInvitationCode(data.invitationCode);
        gameStore.setIsLocked(data.isLocked, false);
        gameStore.setPublicName(data.publicName);
    },
);

socket.on("Room.Info.InvitationCode.Set", (invitationCode: string) => {
    gameStore.setInvitationCode(invitationCode);
});

socket.on("Room.Info.Players.Add", (data: Omit<Player, "showRect">) => {
    playerSystem.addPlayer({ ...data, showRect: false });
});

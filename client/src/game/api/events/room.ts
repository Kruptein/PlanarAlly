import { gameSystem } from "../../systems/game";
import { playerSystem } from "../../systems/players";
import type { Player } from "../../systems/players/models";
import { socket } from "../socket";

socket.on(
    "Room.Info.Set",
    (data: { name: string; creator: string; invitationCode: string; isLocked: boolean; publicName: string }) => {
        gameSystem.setRoomName(data.name);
        gameSystem.setRoomCreator(data.creator);
        gameSystem.setInvitationCode(data.invitationCode);
        gameSystem.setIsLocked(data.isLocked, false);
        gameSystem.setPublicName(data.publicName);
    },
);

socket.on("Room.Info.InvitationCode.Set", (invitationCode: string) => {
    gameSystem.setInvitationCode(invitationCode);
});

socket.on("Room.Info.Players.Add", (data: Omit<Player, "showRect">) => {
    playerSystem.addPlayer({ ...data, showRect: false });
});

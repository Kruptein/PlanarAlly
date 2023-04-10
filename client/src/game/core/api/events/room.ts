import type { RoomInfoPlayersAdd, RoomInfoSet } from "../../../../apiTypes";
import { Role } from "../../models/role";
import { gameSystem } from "../../systems/game";
import { playerSystem } from "../../systems/players";
import { socket } from "../socket";

socket.on("Room.Info.Set", (data: RoomInfoSet) => {
    gameSystem.setRoomName(data.name);
    gameSystem.setRoomCreator(data.creator);
    gameSystem.setInvitationCode(data.invitationCode);
    gameSystem.setIsLocked(data.isLocked, false);
    gameSystem.setPublicName(data.publicName);
});

socket.on("Room.Info.InvitationCode.Set", (invitationCode: string) => {
    gameSystem.setInvitationCode(invitationCode);
});

socket.on("Room.Info.Players.Add", (data: RoomInfoPlayersAdd) => {
    playerSystem.addPlayer({ ...data, role: Role.Player, showRect: false });
});

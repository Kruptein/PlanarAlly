import { socket } from "../socket";
import { ServerGroup } from "../../comm/types/groups";
import { wrapSocket } from "../helpers";

export async function requestGroupInfo(groupId: string): Promise<ServerGroup> {
    socket.emit("Group.Info.Get", groupId);
    return await new Promise((resolve: (value: ServerGroup) => void) => socket.once("Group.Info", resolve));
}
export const sendCreateGroup = wrapSocket<ServerGroup>("Group.Create");

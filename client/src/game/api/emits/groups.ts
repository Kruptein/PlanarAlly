import { GroupJoinPayload, ServerGroup } from "../../comm/types/groups";
import { wrapSocket } from "../helpers";
import { socket } from "../socket";

export async function requestGroupInfo(groupId: string): Promise<ServerGroup> {
    socket.emit("Group.Info.Get", groupId);
    return await new Promise((resolve: (value: ServerGroup) => void) =>
        socket.on("Group.Info", (value: ServerGroup) => {
            if (value.uuid === groupId) {
                socket.off("Group.Id");
                resolve(value);
            }
        }),
    );
}
export const sendGroupUpdate = wrapSocket<ServerGroup>("Group.Update");
export const sendMemberBadgeUpdate = wrapSocket<{ uuid: string; badge: number }[]>("Group.Members.Update");
export const sendCreateGroup = wrapSocket<ServerGroup>("Group.Create");
export const sendGroupJoin = wrapSocket<GroupJoinPayload>("Group.Join");
export const sendGroupLeave = wrapSocket<{ uuid: string; group_id: string }[]>("Group.Leave");
export const sendRemoveGroup = wrapSocket<string>("Group.Remove");

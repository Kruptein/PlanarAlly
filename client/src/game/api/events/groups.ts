import { addGroupMembers, addNewGroup, removeGroup, removeGroupMember, updateGroupFromServer } from "../../groups";
import { getLocalId, getShapeFromGlobal } from "../../id";
import type { GlobalId } from "../../id";
import { groupToClient } from "../../models/groups";
import type { GroupJoinPayload, ServerGroup } from "../../models/groups";
import { socket } from "../socket";

socket.on("Group.Update", (data: ServerGroup) => {
    updateGroupFromServer(data);
});

socket.on("Group.Create", (data: ServerGroup) => {
    addNewGroup(groupToClient(data), false);
});

socket.on("Group.Join", (data: GroupJoinPayload) => {
    addGroupMembers(
        data.group_id,
        data.members.map((m) => ({ badge: m.badge, uuid: getLocalId(m.uuid)! })),
        false,
    );
});

socket.on("Group.Leave", (data: { uuid: GlobalId; group_id: string }[]) => {
    for (const member of data) {
        removeGroupMember(member.group_id, getLocalId(member.uuid)!, false);
    }
});

socket.on("Group.Remove", (data: string) => {
    removeGroup(data, false);
});

socket.on("Group.Members.Update", (data: { uuid: GlobalId; badge: number }[]) => {
    for (const { uuid, badge } of data) {
        const shape = getShapeFromGlobal(uuid);
        if (shape === undefined) return;
        shape.badge = badge;
        shape.invalidate(true);
    }
});

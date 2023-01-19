import type { ApiGroup, GroupJoin, GroupLeave, GroupMemberBadge } from "../../../apiTypes";
import { socket } from "../../api/socket";
import { getLocalId, getShapeFromGlobal } from "../../id";
import type { GlobalId } from "../../id";

import { groupToClient } from "./models";

import { groupSystem } from ".";

socket.on("Group.Update", (data: ApiGroup) => {
    groupSystem.updateGroupFromServer(data);
});

socket.on("Group.Create", (data: ApiGroup) => {
    groupSystem.addNewGroup(groupToClient(data), false);
});

socket.on("Group.Join", (data: GroupJoin) => {
    groupSystem.addGroupMembers(
        data.group_id,
        data.members.map((m) => ({ badge: m.badge, uuid: getLocalId(m.uuid as GlobalId)! })),
        false,
    );
});

socket.on("Group.Leave", (data: GroupLeave[]) => {
    for (const member of data) {
        groupSystem.removeGroupMember(getLocalId(member.uuid as GlobalId)!, false);
    }
});

socket.on("Group.Remove", (data: string) => {
    groupSystem.removeGroup(data, false);
});

socket.on("Group.Members.Update", (data: GroupMemberBadge[]) => {
    for (const { uuid, badge } of data) {
        const shape = getShapeFromGlobal(uuid as GlobalId);
        if (shape === undefined) return;
        groupSystem.setBadge(shape.id, badge);
        shape.invalidate(true);
    }
});

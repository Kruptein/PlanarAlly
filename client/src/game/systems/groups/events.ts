import { socket } from "../../api/socket";
import { getLocalId, getShapeFromGlobal } from "../../id";
import type { GlobalId } from "../../id";

import { type GroupJoinPayload, groupToClient, type ServerGroup } from "./models";

import { groupSystem } from ".";

socket.on("Group.Update", (data: ServerGroup) => {
    groupSystem.updateGroupFromServer(data);
});

socket.on("Group.Create", (data: ServerGroup) => {
    groupSystem.addNewGroup(groupToClient(data), false);
});

socket.on("Group.Join", (data: GroupJoinPayload) => {
    groupSystem.addGroupMembers(
        data.group_id,
        data.members.map((m) => ({ badge: m.badge, uuid: getLocalId(m.uuid)! })),
        false,
    );
});

socket.on("Group.Leave", (data: { uuid: GlobalId; group_id: string }[]) => {
    for (const member of data) {
        groupSystem.removeGroupMember(getLocalId(member.uuid)!, false);
    }
});

socket.on("Group.Remove", (data: string) => {
    groupSystem.removeGroup(data, false);
});

socket.on("Group.Members.Update", (data: { uuid: GlobalId; badge: number }[]) => {
    for (const { uuid, badge } of data) {
        const shape = getShapeFromGlobal(uuid);
        if (shape === undefined) return;
        groupSystem.setBadge(shape.id, badge);
        shape.invalidate(true);
    }
});

import { groupToClient, ServerGroup } from "../../comm/types/groups";
import { addGroupMember, addNewGroup, removeGroup, removeGroupMember, updateGroupFromServer } from "../../groups";
import { layerManager } from "../../layers/manager";
import { socket } from "../socket";

socket.on("Group.Update", (data: ServerGroup) => {
    updateGroupFromServer(data);
});

socket.on("Group.Create", (data: ServerGroup) => {
    addNewGroup(groupToClient(data), false);
});

socket.on("Group.Join", (data: { uuid: string; badge: number; group_id: string }[]) => {
    for (const member of data) {
        addGroupMember(member.group_id, member.uuid, false, member.badge);
    }
});

socket.on("Group.Leave", (data: { uuid: string; group_id: string }[]) => {
    for (const member of data) {
        removeGroupMember(member.group_id, member.uuid, false);
    }
});

socket.on("Group.Remove", (data: string) => {
    removeGroup(data, false);
});

socket.on("Group.Members.Update", (data: { uuid: string; badge: number }[]) => {
    for (const { uuid, badge } of data) {
        const shape = layerManager.UUIDMap.get(uuid);
        if (shape === undefined) return;
        shape.badge = badge;
        shape.invalidate(true);
    }
});

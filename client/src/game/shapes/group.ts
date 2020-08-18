import { sendGroupLeaderUpdate, sendGroupMemberAdd } from "../api/emits/shape/core";
import { layerManager } from "../layers/manager";
import { Shape } from "./shape";

export function changeGroupLeader(data: { leader: string; members: string[]; sync: boolean }): void {
    const groupLeader = layerManager.UUIDMap.get(data.leader);
    const groupMembers = data.members.map(m => layerManager.UUIDMap.get(m)).filter((m): m is Shape => m !== undefined);

    if (groupLeader === undefined) return;

    for (const member of groupMembers) member.options.set("groupId", groupLeader.uuid);

    groupLeader.options.set("groupInfo", data.members);
    groupLeader.options.delete("groupId");

    if (data.sync) sendGroupLeaderUpdate({ ...data });
}

export function addGroupMember(data: { leader: string; member: string; sync: boolean }): void {
    const groupLeader = layerManager.UUIDMap.get(data.leader)!;
    groupLeader.options.set("groupInfo", [...groupLeader.options.get("groupInfo"), data.member]);
    if (data.sync) sendGroupMemberAdd({ ...data });
}

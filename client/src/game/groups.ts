import {
    requestGroupInfo,
    sendCreateGroup,
} from "./api/emits/groups";
import { Group, groupToClient, groupToServer } from "./comm/types/groups";
const groupMap: Map<string, Group> = new Map();
const memberMap: Map<string, Set<string>> = new Map();

export function addNewGroup(group: Group, sync: boolean): void {
    groupMap.set(group.uuid, group);
    memberMap.set(group.uuid, new Set());
    if (sync) {
        sendCreateGroup(groupToServer(group));
    }
}

export async function fetchGroup(groupId: string): Promise<Group> {
    const groupInfo = groupToClient(await requestGroupInfo(groupId));
    addNewGroup(groupInfo, false);
    return groupInfo;
}

import { ref } from "vue";
import type { Ref } from "vue";

import { UI_SYNC } from "../core/models/types";
import { uuidv4 } from "../core/utils";

import {
    sendCreateGroup,
    sendGroupJoin,
    sendGroupLeave,
    sendGroupUpdate,
    sendMemberBadgeUpdate,
    sendRemoveGroup,
} from "./api/emits/groups";
import { getGlobalId, getShape } from "./id";
import type { LocalId } from "./id";
import { groupToClient, groupToServer } from "./models/groups";
import type { CREATION_ORDER_TYPES, Group, ServerGroup } from "./models/groups";
import type { IShape } from "./shapes/interfaces";

const numberCharacterSet = "0123456789".split("");
const latinCharacterSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
export const CHARACTER_SETS = [numberCharacterSet, latinCharacterSet];

export const groupMap: Ref<Map<string, Group>> = ref(new Map());
export const memberMap: Ref<Map<string, Set<LocalId>>> = ref(new Map());

export function addNewGroup(group: Group, sync: boolean): void {
    groupMap.value.set(group.uuid, group);
    memberMap.value.set(group.uuid, new Set());
    if (sync) {
        sendCreateGroup(groupToServer(group));
    }
}

export function hasGroup(groupId: string): boolean {
    return groupMap.value.has(groupId);
}

export function removeGroup(groupId: string, sync: boolean): void {
    const members = getGroupMembers(groupId);
    for (const member of members) {
        member.groupId = undefined;
        member.setShowBadge(false, UI_SYNC);
    }
    if (sync) sendRemoveGroup(groupId);
    memberMap.value.delete(groupId);
    groupMap.value.delete(groupId);
}

export function createNewGroupForShapes(shapes: LocalId[], keepBadges = false): void {
    const group: Group = {
        uuid: uuidv4(),
        characterSet: numberCharacterSet,
        creationOrder: "incrementing",
    };
    addNewGroup(group, true);
    addGroupMembers(
        group.uuid,
        shapes.map((s) => ({ uuid: s, badge: keepBadges ? getShape(s)!.badge : undefined })),
        true,
    );
}

export function updateGroupFromServer(serverGroup: ServerGroup): void {
    const group = groupToClient(serverGroup);
    groupMap.value.set(group.uuid, group);
    for (const layer of new Set(getGroupMembers(group.uuid).map((s) => s.layer))) {
        layer.invalidate(true);
    }
}

export function getGroupSize(groupId: string): number {
    return memberMap.value.get(groupId)?.size ?? 0;
}

export function getGroupMembers(groupId: string): IShape[] {
    const members = memberMap.value.get(groupId);
    if (members === undefined) return [];
    return [...members].map((m) => getShape(m)!);
}

export function addGroupMembers(groupId: string, members: { uuid: LocalId; badge?: number }[], sync: boolean): void {
    const newMembers: { uuid: LocalId; badge: number }[] = [];
    for (const member of members) {
        if (member.badge === undefined) {
            member.badge = generateNewBadge(groupId);
        }
        newMembers.push(member as { uuid: LocalId; badge: number });
        const shape = getShape(member.uuid);
        if (shape && shape.groupId !== groupId) {
            if (shape.groupId !== undefined) {
                memberMap.value.get(shape.groupId)?.delete(shape.id);
            }
            shape.setGroupId(groupId, UI_SYNC);
            shape.badge = member.badge;
            shape.invalidate(true);
        }
        memberMap.value.get(groupId)?.add(member.uuid);
    }
    if (sync) {
        sendGroupJoin({
            group_id: groupId,
            members: newMembers.map((m) => ({ uuid: getGlobalId(m.uuid), badge: m.badge })),
        });
    }
}

export function removeGroupMember(groupId: string, member: LocalId, sync: boolean): void {
    const members = memberMap.value.get(groupId);
    members?.delete(member);
    const shape = getShape(member);
    if (shape !== undefined) shape.setShowBadge(false, UI_SYNC);
    if (sync) {
        sendGroupLeave([{ uuid: getGlobalId(member), group_id: groupId }]);
    }
}

export function setCharacterSet(groupId: string, characterSet: string[]): void {
    const newGroupInfo = { ...groupMap.value.get(groupId)!, characterSet };
    groupMap.value.set(groupId, newGroupInfo);
    sendGroupUpdate(groupToServer(newGroupInfo));
}

export function setCreationOrder(groupId: string, creationOrder: CREATION_ORDER_TYPES): void {
    const newGroupInfo = { ...groupMap.value.get(groupId)!, creationOrder };
    groupMap.value.set(groupId, newGroupInfo);
    sendGroupUpdate(groupToServer(newGroupInfo));

    const members = getGroupMembers(groupId);

    const alphabet = Array.from({ length: Math.max(10, members.length * 2) }, (_, i) => i);

    for (const [i, member] of members.entries()) {
        if (creationOrder === "incrementing") {
            member.badge = i;
        } else {
            const index = Math.floor(Math.random() * alphabet.length);
            member.badge = alphabet[index];
            alphabet.splice(index, 1);
        }
    }

    sendMemberBadgeUpdate(
        members.map((m) => ({
            uuid: getGlobalId(m.id),
            badge: m.badge,
        })),
    );
}

export function getBadgeCharacters(shape: IShape): string {
    if (shape.groupId === undefined) return "0";

    const group = groupMap.value.get(shape.groupId);

    if (group === undefined) {
        console.warn("could not fetch badge characters");
        return "0";
    }

    if (group.characterSet.join("") === numberCharacterSet.join("")) return (shape.badge + 1).toString();

    const csLength = group.characterSet.length;
    const message: string[] = [];
    let badge = shape.badge;
    while (badge >= 0) {
        const mod = badge % csLength;
        message.unshift(group.characterSet[mod]);
        if (badge === 0) break;
        badge = (badge - mod) / csLength - 1;
    }
    return message.join("");
}

function generateNewBadge(groupId: string): number {
    const group = groupMap.value.get(groupId)!;
    const members = getGroupMembers(groupId);
    const badges = members.map((m) => m.badge);
    const membersLength = Math.max(2 * members.length + 1, 10);

    if (group.creationOrder === "incrementing") {
        return Math.max(-1, ...badges) + 1;
    } else {
        let value: number | undefined;
        while (value === undefined || badges.includes(value)) {
            value = Math.floor(Math.random() * membersLength);
        }
        return value;
    }
}

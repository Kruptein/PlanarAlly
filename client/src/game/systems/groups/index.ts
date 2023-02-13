import { registerSystem, type ShapeSystem } from "..";
import { UI_SYNC } from "../../../core/models/types";
import { uuidv4 } from "../../../core/utils";
import { getGlobalId, getShape, type GlobalId, type LocalId } from "../../id";
import { propertiesSystem } from "../properties";

import {
    sendCreateGroup,
    sendGroupJoin,
    sendGroupLeave,
    sendGroupUpdate,
    sendMemberBadgeUpdate,
    sendRemoveGroup,
} from "./emits";
import {
    type CREATION_ORDER_TYPES,
    groupToServer,
    type Group,
    CharacterSet,
    type ServerGroup,
    groupToClient,
} from "./models";
import { groupState } from "./state";

const { mutableReactive: $, mutable, readonly } = groupState;

class GroupSystem implements ShapeSystem {
    // Inform the system about the state of a certain LocalId
    inform(id: LocalId, data: { groupId: string | undefined; badge: number }): void {
        mutable.shapeData.set(id, data);
    }

    drop(id: LocalId): void {
        mutable.shapeData.delete(id);
        if ($.activeId === id) {
            $.activeId = undefined;
            $.activeGroupId = undefined;
        }
    }

    loadState(id: LocalId): void {
        $.activeId = id;
        const data = mutable.shapeData.get(id);
        $.activeGroupId = data?.groupId;
    }

    dropState(): void {
        $.activeId = undefined;
        $.activeGroupId = undefined;
    }

    clear(): void {
        this.dropState();
    }

    // END OF ACTIVE SHAPE STUFF

    hasGroup(groupId: string): boolean {
        return readonly.groups.has(groupId);
    }

    getGroupId(id: LocalId): string | undefined {
        return readonly.shapeData.get(id)?.groupId;
    }

    getGroupSize(groupId: string): number {
        return readonly.groupMembers.get(groupId)?.size ?? 0;
    }

    addNewGroup(group: Group, sync: boolean): void {
        mutable.groups.set(group.uuid, group);
        mutable.groupMembers.set(group.uuid, new Set());
        if (sync) {
            sendCreateGroup(groupToServer(group));
        }
    }

    createNewGroupForShapes(shapes: LocalId[], keepBadges = false): void {
        const group: Group = {
            uuid: uuidv4(),
            characterSet: CharacterSet.number,
            creationOrder: "incrementing",
        };
        this.addNewGroup(group, true);
        this.addGroupMembers(
            group.uuid,
            shapes.map((s) => ({ uuid: s, badge: keepBadges ? this.getBadge(s) : undefined })),
            true,
        );
    }

    removeGroup(groupId: string, sync: boolean): void {
        for (const member of mutable.groupMembers.get(groupId)!) {
            mutable.shapeData.delete(member);
            propertiesSystem.setShowBadge(member, false, UI_SYNC);
        }
        if (sync) sendRemoveGroup(groupId);
        mutable.groups.delete(groupId);
        mutable.groupMembers.delete(groupId);
    }

    // members

    getGroupMembers(groupId: string): ReadonlySet<LocalId> {
        const members = readonly.groupMembers.get(groupId);
        return members ?? new Set();
    }

    addGroupMembers(groupId: string, members: { uuid: LocalId; badge?: number }[], sync: boolean): void {
        const newMembers: { uuid: GlobalId; badge: number }[] = [];
        for (const member of members) {
            const uuid = getGlobalId(member.uuid);
            if (uuid === undefined) continue;

            if (member.badge === undefined) {
                member.badge = this.generateNewBadge(groupId);
            }
            newMembers.push({ badge: member.badge, uuid });
            const memberGroupId = this.getGroupId(member.uuid);
            if (groupId !== memberGroupId) {
                if (memberGroupId !== undefined) {
                    mutable.groupMembers.get(memberGroupId)?.delete(member.uuid);
                }
                if (!mutable.shapeData.has(member.uuid)) {
                    this.inform(member.uuid, { groupId, badge: 0 });
                } else {
                    mutable.shapeData.set(member.uuid, { groupId, badge: member.badge });
                }
                // todo: invalidate(true) shape
            }
            mutable.groupMembers.get(groupId)?.add(member.uuid);
        }
        if (sync) {
            sendGroupJoin({
                group_id: groupId,
                members: newMembers,
            });
        }
    }

    removeGroupMember(member: LocalId, sync: boolean): void {
        const uuid = getGlobalId(member);
        const groupId = this.getGroupId(member);
        if (uuid === undefined || groupId === undefined) return;

        mutable.groupMembers.get(groupId)?.delete(member);
        mutable.shapeData.delete(member);

        propertiesSystem.setShowBadge(member, false, UI_SYNC);
        if (sync) {
            sendGroupLeave([{ uuid, group_id: groupId }]);
        }
    }

    // char set

    setCharacterSet(groupId: string, characterSet: string[]): void {
        const group = readonly.groups.get(groupId);
        if (group === undefined) return;

        const newGroupInfo = { ...group, characterSet };
        mutable.groups.set(groupId, newGroupInfo);
        sendGroupUpdate(groupToServer(newGroupInfo));
    }

    setCreationOrder(groupId: string, creationOrder: CREATION_ORDER_TYPES): void {
        const group = readonly.groups.get(groupId);
        if (group === undefined) return;

        const newGroupInfo = { ...group, creationOrder, characterSet: [...group.characterSet] };
        mutable.groups.set(groupId, newGroupInfo);
        sendGroupUpdate(groupToServer(newGroupInfo));

        const members = this.getGroupMembers(groupId);

        const alphabet = Array.from({ length: Math.max(10, members.size * 2) }, (_, i) => i);

        for (const [i, member] of members.entries()) {
            if (creationOrder === "incrementing") {
                this.setBadge(member, i);
            } else {
                const index = Math.floor(Math.random() * alphabet.length);
                this.setBadge(member, alphabet[index]!);
                alphabet.splice(index, 1);
            }
        }

        sendMemberBadgeUpdate(
            [...members].map((m) => ({
                uuid: getGlobalId(m)!,
                badge: this.getBadge(m),
            })),
        );
    }

    // badge

    getBadge(id: LocalId): number {
        return readonly.shapeData.get(id)?.badge ?? 0;
    }

    setBadge(id: LocalId, badge: number): void {
        mutable.shapeData.get(id)!.badge = badge;
    }

    generateNewBadge(groupId: string): number {
        const group = readonly.groups.get(groupId);
        if (group === undefined) throw new Error("Invalid groupId provided");

        const members = this.getGroupMembers(groupId);
        const badges = [...members].map((m) => this.getBadge(m));
        const membersLength = Math.max(2 * members.size + 1, 10);

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

    getBadgeCharacters(shapeId: LocalId): string {
        const shapeData = readonly.shapeData.get(shapeId);
        const groupId = shapeData?.groupId;
        if (shapeData === undefined || groupId === undefined) return "0";

        const group = readonly.groups.get(groupId);

        if (group === undefined) {
            console.warn("could not fetch badge characters");
            return "0";
        }

        if (group.characterSet.join("") === CharacterSet.number.join("")) return (shapeData.badge + 1).toString();

        const csLength = group.characterSet.length;
        const message: string[] = [];
        let badge = shapeData.badge;
        while (badge >= 0) {
            const mod = badge % csLength;
            message.unshift(group.characterSet[mod]!);
            if (badge === 0) break;
            badge = (badge - mod) / csLength - 1;
        }
        return message.join("");
    }

    // server

    updateGroupFromServer(serverGroup: ServerGroup): void {
        const group = groupToClient(serverGroup);
        mutable.groups.set(group.uuid, group);
        for (const member of this.getGroupMembers(group.uuid)) {
            getShape(member)?.layer?.invalidate(true);
        }
    }
}

export const groupSystem = new GroupSystem();
registerSystem("groups", groupSystem, false, groupState);

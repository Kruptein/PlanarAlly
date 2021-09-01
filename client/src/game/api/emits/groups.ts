import type { GroupJoinPayload, ServerGroup } from "../../models/groups";
import { wrapSocket } from "../helpers";

export const sendGroupUpdate = wrapSocket<ServerGroup>("Group.Update");
export const sendMemberBadgeUpdate = wrapSocket<{ uuid: string; badge: number }[]>("Group.Members.Update");
export const sendCreateGroup = wrapSocket<ServerGroup>("Group.Create");
export const sendGroupJoin = wrapSocket<GroupJoinPayload>("Group.Join");
export const sendGroupLeave = wrapSocket<{ uuid: string; group_id: string }[]>("Group.Leave");
export const sendRemoveGroup = wrapSocket<string>("Group.Remove");

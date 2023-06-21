import type { ApiGroup, GroupJoin, GroupLeave, GroupMemberBadge } from "../../../apiTypes";
import { wrapSocket } from "../../api/helpers";

export const sendGroupUpdate = wrapSocket<ApiGroup>("Group.Update");
export const sendMemberBadgeUpdate = wrapSocket<GroupMemberBadge[]>("Group.Members.Update");
export const sendCreateGroup = wrapSocket<ApiGroup>("Group.Create");
export const sendGroupJoin = wrapSocket<GroupJoin>("Group.Join");
export const sendGroupLeave = wrapSocket<GroupLeave[]>("Group.Leave");
export const sendRemoveGroup = wrapSocket<string>("Group.Remove");

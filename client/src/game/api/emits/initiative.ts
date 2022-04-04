import type { GlobalId } from "../../id";
import type { InitiativeData, InitiativeEffect, InitiativeSort } from "../../models/initiative";
import { wrapSocket } from "../helpers";
import { socket } from "../socket";

export const sendInitiativeAdd = wrapSocket<InitiativeData<GlobalId>>("Initiative.Add");
export const sendInitiativeRemove = wrapSocket<GlobalId>("Initiative.Remove");
export const sendInitiativeSetValue = wrapSocket<{ shape: GlobalId; value: number }>("Initiative.Value.Set");
export const sendInitiativeTurnUpdate = wrapSocket<number>("Initiative.Turn.Update");
export const sendInitiativeRoundUpdate = wrapSocket<number>("Initiative.Round.Update");
export const sendInitiativeNewEffect = wrapSocket<{ actor: GlobalId; effect: InitiativeEffect }>(
    "Initiative.Effect.New",
);
export const sendInitiativeRenameEffect = wrapSocket<{ shape: GlobalId; index: number; name: string }>(
    "Initiative.Effect.Rename",
);
export const sendInitiativeTurnsEffect = wrapSocket<{ shape: GlobalId; index: number; turns: string }>(
    "Initiative.Effect.Turns",
);
export const sendInitiativeRemoveEffect = wrapSocket<{ shape: GlobalId; index: number }>("Initiative.Effect.Remove");
export const sendInitiativeOptionUpdate = wrapSocket<{ shape: GlobalId; option: string; value: boolean }>(
    "Initiative.Option.Update",
);
export const sendRequestInitiatives = (): void => {
    socket.emit("Initiative.Request");
};
export const sendInitiativeClear = (): void => {
    socket.emit("Initiative.Clear");
};
export const sendInitiativeReorder = wrapSocket<{ shape: GlobalId; oldIndex: number; newIndex: number }>(
    "Initiative.Order.Change",
);
export const sendInitiativeSetSort = wrapSocket<InitiativeSort>("Initiative.Sort.Set");

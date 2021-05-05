import { InitiativeData, InitiativeEffect, InitiativeSort } from "../../models/initiative";
import { wrapSocket } from "../helpers";
import { socket } from "../socket";

export const sendInitiativeAdd = wrapSocket<InitiativeData>("Initiative.Add");
export const sendInitiativeRemove = wrapSocket<string>("Initiative.Remove");
export const sendInitiativeSetValue = wrapSocket<{ shape: string; value: number }>("Initiative.Value.Set");
export const sendInitiativeTurnUpdate = wrapSocket<number>("Initiative.Turn.Update");
export const sendInitiativeRoundUpdate = wrapSocket<number>("Initiative.Round.Update");
export const sendInitiativeNewEffect = wrapSocket<{ actor: string; effect: InitiativeEffect }>("Initiative.Effect.New");
export const sendInitiativeRenameEffect = wrapSocket<{ shape: string; index: number; name: string }>(
    "Initiative.Effect.Rename",
);
export const sendInitiativeTurnsEffect = wrapSocket<{ shape: string; index: number; turns: string }>(
    "Initiative.Effect.Turns",
);
export const sendInitiativeRemoveEffect = wrapSocket<{ shape: string; index: number }>("Initiative.Effect.Remove");
export const sendInitiativeOptionUpdate = wrapSocket<{ shape: string; option: string; value: boolean }>(
    "Initiative.Option.Update",
);
export const sendRequestInitiatives = (): void => {
    socket.emit("Initiative.Request");
};
export const sendInitiativeClear = (): void => {
    socket.emit("Initiative.Clear");
};
export const sendInitiativeReorder = wrapSocket<{ shape: string; oldIndex: number; newIndex: number }>(
    "Initiative.Order.Change",
);
export const sendInitiativeSetSort = wrapSocket<InitiativeSort>("Initiative.Sort.Set");

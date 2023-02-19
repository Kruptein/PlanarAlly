import type {
    InitiativeAdd,
    InitiativeEffectNew,
    InitiativeEffectRemove,
    InitiativeEffectRename,
    InitiativeEffectTurns,
    InitiativeOptionSet,
    InitiativeOrderChange,
    InitiativeValueSet,
} from "../../../apiTypes";
import type { GlobalId } from "../../id";
import type { InitiativeSort } from "../../models/initiative";
import { wrapSocket } from "../helpers";
import { socket } from "../socket";

export const sendInitiativeActive = wrapSocket<boolean>("Initiative.Active.Set");
export const sendInitiativeAdd = wrapSocket<InitiativeAdd>("Initiative.Add");
export const sendInitiativeRemove = wrapSocket<GlobalId>("Initiative.Remove");
export const sendInitiativeSetValue = wrapSocket<InitiativeValueSet>("Initiative.Value.Set");
export const sendInitiativeTurnUpdate = wrapSocket<number>("Initiative.Turn.Update");
export const sendInitiativeRoundUpdate = wrapSocket<number>("Initiative.Round.Update");
export const sendInitiativeNewEffect = wrapSocket<InitiativeEffectNew>("Initiative.Effect.New");
export const sendInitiativeRenameEffect = wrapSocket<InitiativeEffectRename>("Initiative.Effect.Rename");
export const sendInitiativeTurnsEffect = wrapSocket<InitiativeEffectTurns>("Initiative.Effect.Turns");
export const sendInitiativeRemoveEffect = wrapSocket<InitiativeEffectRemove>("Initiative.Effect.Remove");
export const sendInitiativeOptionSet = wrapSocket<InitiativeOptionSet>("Initiative.Option.Set");
export const sendRequestInitiatives = (): void => {
    socket.emit("Initiative.Request");
};
export const sendInitiativeClear = (): void => {
    socket.emit("Initiative.Clear");
};
export const sendInitiativeReorder = wrapSocket<InitiativeOrderChange>("Initiative.Order.Change");
export const sendInitiativeSetSort = wrapSocket<InitiativeSort>("Initiative.Sort.Set");

import { InitiativeData, InitiativeEffect } from "../../models/general";
import { wrapSocket } from "../helpers";

export const sendInitiativeUpdate = wrapSocket<InitiativeData>("Initiative.Update");
export const sendInitiativeRemove = wrapSocket<string>("Initiative.Remove");
export const sendInitiativeSet = wrapSocket<string[]>("Initiative.Set");
export const sendInitiativeTurnUpdate = wrapSocket<string>("Initiative.Turn.Update");
export const sendInitiativeRoundUpdate = wrapSocket<number>("Initiative.Round.Update");
export const sendInitiativeNewEffect = wrapSocket<{ actor: string; effect: InitiativeEffect }>("Initiative.Effect.New");
export const sendInitiativeUpdateEffect = wrapSocket<{ actor: string; effect: InitiativeEffect }>(
    "Initiative.Effect.Update",
);
export const sendInitiativeRemoveEffect = wrapSocket<{ actor: string; effect: InitiativeEffect }>(
    "Initiative.Effect.Remove",
);

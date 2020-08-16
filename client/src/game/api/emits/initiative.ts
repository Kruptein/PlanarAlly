import { InitiativeData, InitiativeEffect } from "../../comm/types/general";
import { socket } from "../socket";

export function sendInitiativeUpdate(data: InitiativeData): void {
    socket.emit("Initiative.Update", data);
}

export function sendInitiativeRemove(uuid: string): void {
    socket.emit("Initiative.Remove", uuid);
}

export function sendInitiativeSet(data: string[]): void {
    socket.emit("Initiative.Set", data);
}

export function sendInitiativeTurnUpdate(data: string): void {
    socket.emit("Initiative.Turn.Update", data);
}

export function sendInitiativeRoundUpdate(data: number): void {
    socket.emit("Initiative.Round.Update", data);
}

export function sendInitiativeNewEffect(data: { actor: string; effect: InitiativeEffect }): void {
    socket.emit("Initiative.Effect.New", data);
}

export function sendInitiativeUpdateEffect(data: { actor: string; effect: InitiativeEffect }): void {
    socket.emit("Initiative.Effect.Update", data);
}

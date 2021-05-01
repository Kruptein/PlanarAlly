import { InitiativeData, InitiativeEffect } from "../../models/general";
import { initiativeStore } from "../../ui/initiative/state";
import { socket } from "../socket";

socket.on("Initiative.Set", (data: InitiativeData[]) => initiativeStore.setData(data));

socket.on("Initiative.Turn.Set", (actor: string) => initiativeStore.setCurrentActor(actor));
socket.on("Initiative.Turn.Update", (actor: string) => initiativeStore.updateTurn(actor, false));
socket.on("Initiative.Round.Update", (round: number) => initiativeStore.setRoundCounter(round, false));
socket.on("Initiative.Effect.New", (data: { actor: string; effect: InitiativeEffect }) => {
    initiativeStore.createEffect(data.actor, data.effect, false);
});
socket.on("Initiative.Effect.Update", (data: { actor: string; effect: InitiativeEffect }) =>
    initiativeStore.updateEffect(data.actor, data.effect, false),
);
socket.on("Initiative.Effect.Remove", (data: { actor: string; effect: string }) =>
    initiativeStore.removeEffect(data.actor, data.effect, false),
);

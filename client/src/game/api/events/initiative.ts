import { getLocalId } from "../../id";
import type { GlobalId } from "../../id";
import type { InitiativeEffect, InitiativeSettings, InitiativeSort } from "../../models/initiative";
import { initiativeStore } from "../../ui/initiative/state";
import { socket } from "../socket";

socket.on("Initiative.Set", (data: InitiativeSettings) => initiativeStore.setData(data));
socket.on("Initiative.Value.Set", (data: { shape: GlobalId; value: number }) =>
    initiativeStore.setInitiative(getLocalId(data.shape)!, data.value, false),
);
socket.on("Initiative.Remove", (data: GlobalId) => initiativeStore.removeInitiative(getLocalId(data)!, false));

socket.on("Initiative.Turn.Update", (turn: number) => initiativeStore.setTurnCounter(turn, false));
socket.on("Initiative.Round.Update", (round: number) => initiativeStore.setRoundCounter(round, false));
socket.on("Initiative.Effect.New", (data: { actor: GlobalId; effect: InitiativeEffect }) => {
    initiativeStore.createEffect(getLocalId(data.actor)!, data.effect, false);
});
socket.on("Initiative.Effect.Rename", (data: { shape: GlobalId; index: number; name: string }) => {
    initiativeStore.setEffectName(getLocalId(data.shape)!, data.index, data.name, false);
});
socket.on("Initiative.Effect.Turns", (data: { shape: GlobalId; index: number; turns: string }) => {
    initiativeStore.setEffectTurns(getLocalId(data.shape)!, data.index, data.turns, false);
});
socket.on("Initiative.Effect.Remove", (data: { shape: GlobalId; index: number }) =>
    initiativeStore.removeEffect(getLocalId(data.shape)!, data.index, false),
);
socket.on("Initiative.Option.Set", (data: { shape: GlobalId; option: "isVisible" | "isGroup"; value: boolean }) =>
    initiativeStore.setOption(getLocalId(data.shape)!, data.option, data.value),
);
socket.on("Initiative.Clear", () => initiativeStore.clearValues(false));
socket.on("Initiative.Sort.Set", (sort: InitiativeSort) => initiativeStore.changeSort(sort, false));

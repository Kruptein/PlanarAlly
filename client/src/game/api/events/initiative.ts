import type {
    ApiInitiative,
    InitiativeEffectNew,
    InitiativeEffectRemove,
    InitiativeEffectRename,
    InitiativeEffectTurns,
    InitiativeOptionSet,
} from "../../../apiTypes";
import type { GlobalId } from "../../id";
import type { InitiativeSort } from "../../models/initiative";
import { initiativeStore } from "../../ui/initiative/state";
import { socket } from "../socket";

socket.on("Initiative.Set", (data: ApiInitiative) => initiativeStore.setData(data));
socket.on("Initiative.Active.Set", (isActive: boolean) => initiativeStore.setActive(isActive));
socket.on("Initiative.Remove", (data: GlobalId) => initiativeStore.removeInitiative(data, false));

socket.on("Initiative.Turn.Update", (turn: number) => initiativeStore.setTurnCounter(turn, false));
socket.on("Initiative.Round.Update", (round: number) => initiativeStore.setRoundCounter(round, false));
socket.on("Initiative.Effect.New", (data: InitiativeEffectNew) => {
    initiativeStore.createEffect(data.actor as GlobalId, data.effect, false);
});
socket.on("Initiative.Effect.Rename", (data: InitiativeEffectRename) => {
    initiativeStore.setEffectName(data.shape as GlobalId, data.index, data.name, false);
});
socket.on("Initiative.Effect.Turns", (data: InitiativeEffectTurns) => {
    initiativeStore.setEffectTurns(data.shape as GlobalId, data.index, data.turns, false);
});
socket.on("Initiative.Effect.Remove", (data: InitiativeEffectRemove) =>
    initiativeStore.removeEffect(data.shape as GlobalId, data.index, false),
);
socket.on("Initiative.Option.Set", (data: InitiativeOptionSet) =>
    initiativeStore.setOption(data.shape as GlobalId, data.option, data.value),
);
socket.on("Initiative.Clear", () => initiativeStore.clearValues(false));
socket.on("Initiative.Sort.Set", (sort: InitiativeSort) => initiativeStore.changeSort(sort, false));

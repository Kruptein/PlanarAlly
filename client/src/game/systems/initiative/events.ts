import type {
    ApiInitiative,
    InitiativeEffectNew,
    InitiativeEffectRemove,
    InitiativeRoundUpdate,
    InitiativeTurnUpdate,
    InitiativeEffectRename,
    InitiativeEffectTiming,
    InitiativeEffectTurns,
    InitiativeOptionSet,
} from "../../../apiTypes";
import type { GlobalId } from "../../../core/id";
import { socket } from "../../api/socket";

import type { InitiativeSort } from "./models";
import { InitiativeTurnDirection } from "./models";

import { initiativeSystem } from ".";

socket.on("Initiative.Set", (data: ApiInitiative) => initiativeSystem.setData(data));
socket.on("Initiative.Active.Set", (isActive: boolean) => initiativeSystem.setActive(isActive));
socket.on("Initiative.Remove", (data: GlobalId) => initiativeSystem.removeInitiative(data, false));

socket.on("Initiative.Turn.Update", (data: InitiativeTurnUpdate) =>
    initiativeSystem.setTurnCounter(data.turn, data.direction, {
        sync: false,
        updateEffects: data.processEffects,
    }),
);
socket.on("Initiative.Turn.Set", (turn: number) =>
    initiativeSystem.setTurnCounter(turn, InitiativeTurnDirection.Null, {
        sync: false,
        updateEffects: false,
    }),
);
socket.on("Initiative.Round.Update", (data: InitiativeRoundUpdate) =>
    initiativeSystem.setRoundCounter(data.round, data.direction, {
        sync: false,
        updateEffects: data.processEffects,
    }),
);
socket.on("Initiative.Effect.New", (data: InitiativeEffectNew) => {
    initiativeSystem.createEffect(data.actor, data.effect, false);
});
socket.on("Initiative.Effect.Rename", (data: InitiativeEffectRename) => {
    initiativeSystem.setEffectName(data.shape, data.index, data.name, false);
});
socket.on("Initiative.Effect.Timing", (data: InitiativeEffectTiming) => {
    initiativeSystem.setEffectUpdateTiming(data.shape, data.index, data.timing, false);
});
socket.on("Initiative.Effect.Turns", (data: InitiativeEffectTurns) => {
    initiativeSystem.setEffectTurns(data.shape, data.index, data.turns, false);
});
socket.on("Initiative.Effect.Remove", (data: InitiativeEffectRemove) =>
    initiativeSystem.removeEffect(data.shape, data.index, false),
);
socket.on("Initiative.Option.Set", (data: InitiativeOptionSet) =>
    initiativeSystem.setOption(data.shape, data.option, data.value),
);
socket.on("Initiative.Clear", () => initiativeSystem.clearValues(false));
socket.on("Initiative.Wipe", () => initiativeSystem.clearEntries(false));
socket.on("Initiative.Sort.Set", (sort: InitiativeSort) => initiativeSystem.changeSort(sort, false));

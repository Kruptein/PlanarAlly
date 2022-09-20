import type { GlobalPoint } from "../../../core/geometry";
import { lastGameboardStore } from "../../../store/lastGameboard";
import { getLocalId } from "../../id";
import type { GlobalId } from "../../id";
import type { LgSpawn } from "../../models/lg";
import { socket } from "../socket";

socket.on("Lg.Spawn.Add", (data: LgSpawn) => {
    lastGameboardStore.addSpawnShape(data, false);
});

socket.on("Lg.Spawn.Remove", (data: number) => {
    lastGameboardStore.removeSpawnId(data, false);
});

socket.on("Lg.Spawn.Do", (data: { typeId: number; position: GlobalPoint }) => {
    lastGameboardStore.spawnShape(data.typeId, data.position);
});

socket.on("Lg.Spawn.Uuid", (data: { typeId: number; uuid: GlobalId }) => {
    lastGameboardStore.linkSpawnedShape(data.typeId, getLocalId(data.uuid)!);
});

socket.on("Lg.Token.Connect", (data: { typeId: number; uuid: GlobalId }) => {
    lastGameboardStore.addLgShape(data.typeId, getLocalId(data.uuid)!, false);
});

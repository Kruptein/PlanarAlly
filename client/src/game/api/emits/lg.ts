import type { GlobalPoint } from "../../../core/geometry";
import type { GlobalId } from "../../id";
import type { LgSpawn } from "../../models/lg";
import { wrapSocket } from "../helpers";

export const sendAddSpawnShape = wrapSocket<LgSpawn>("Lg.Spawn.Add");
export const sendRemoveSpawnShape = wrapSocket<number>("Lg.Spawn.Remove");
export const sendDoSpawnShape = wrapSocket<{ typeId: number; position: GlobalPoint }>("Lg.Spawn.Do");
export const sendSpawnedShapeId = wrapSocket<{ typeId: number; uuid: GlobalId }>("Lg.Spawn.Uuid");
export const sendLgTokenConnect = wrapSocket<{ typeId: number; uuid: GlobalId }>("Lg.Token.Connect");

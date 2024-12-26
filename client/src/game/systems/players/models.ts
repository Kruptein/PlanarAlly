import type { PlayerInfoCore } from "../../../apiTypes";
import type { NumberId } from "../../../core/id";

export type PlayerId = NumberId<"playerId">;
export type Player = PlayerInfoCore & { showRect: boolean };

import type { NumberId } from "../../id";

export type PlayerId = NumberId<"playerId">;

export interface Player {
    id: PlayerId;
    name: string;
    location: number;
    role: number;
    showRect: boolean;
}

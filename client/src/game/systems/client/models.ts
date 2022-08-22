import type { StringId } from "../../id";

export type ClientId = StringId<"clientId">;

export interface Viewport {
    width: number;
    height: number;
}

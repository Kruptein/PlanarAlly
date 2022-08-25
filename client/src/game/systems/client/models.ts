import type { StringId } from "../../id";

export type BoardId = StringId<"boardId">;
export type ClientId = StringId<"clientId">;

export interface Viewport {
    width: number;
    height: number;
    zoom_factor: number;
    offset_x?: number;
    offset_y?: number;
}

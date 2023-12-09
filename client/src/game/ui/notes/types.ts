import type { GlobalPoint } from "../../../core/geometry";

export const noteTypes = ["campaign", "location", "shape"] as const;

export interface Note {
    name: string;
    tags: { name: string; colour: string }[];
    type: (typeof noteTypes)[number];
    location?: GlobalPoint;
}

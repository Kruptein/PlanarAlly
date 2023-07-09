import type { LocalId } from "../../id";

export type TrackerId = string & { __brand: "trackerId" };

export interface Tracker {
    uuid: TrackerId;
    visible: boolean;
    name: string;
    value: number;
    maxvalue: number;
    draw: boolean;
    primaryColor: string;
    secondaryColor: string;
    customDraw?: (
        ctx: CanvasRenderingContext2D,
        location: { x: number; y: number; width: number; height: number },
        tracker: Tracker,
    ) => void;
}

export type UiTracker = { shape: LocalId; temporary: boolean } & Tracker;

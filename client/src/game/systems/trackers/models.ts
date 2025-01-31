import type { LocalId } from "../../../core/id";

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
}

export type UiTracker = { shape: LocalId; temporary: boolean } & Tracker;

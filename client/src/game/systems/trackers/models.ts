import type { GlobalId, LocalId } from "../../id";

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

export interface ServerTracker {
    shape: GlobalId;
    uuid: TrackerId;
    visible: boolean;
    name: string;
    value: number;
    maxvalue: number;
    draw: boolean;
    primary_color: string;
    secondary_color: string;
}

export type UiTracker = { shape: LocalId; temporary: boolean } & Tracker;

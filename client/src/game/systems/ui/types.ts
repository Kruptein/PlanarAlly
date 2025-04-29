import type { Component, Raw } from "vue";

import type { LocalId } from "../../../core/id";
import type { TrackerId } from "../trackers/models";

export interface PanelTab {
    id: string;
    label: string;
    component: Component;
}

export interface ModTrackerSetting {
    name: string;
    component: Raw<Component>;
    filter?: (shape: LocalId, tracker: TrackerId) => boolean;
}

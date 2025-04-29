import type { ApiModMeta } from "../apiTypes";
import type { Section } from "../core/components/contextMenu/types";
import { type GlobalId, type LocalId } from "../core/id";
import type { SYSTEMS_STATE, System } from "../core/systems";
import type { IShape } from "../game/interfaces/shape";
import type { Tracker } from "../game/systems/trackers/models";
import type { PanelTab } from "../game/systems/ui/types";

import type { ModDataBlockFunctions } from "./db";

export interface Mod {
    events?: {
        init?: (meta: ApiModMeta) => Promise<void>;
        initGame?: (data: ModLoad & ModDataBlockFunctions) => Promise<void>;
        loadLocation?: () => Promise<void>;

        preTrackerUpdate?: (id: LocalId, tracker: Tracker, delta: Partial<Tracker>) => Partial<Tracker>;
    };
}

interface ModLoad {
    systems: Record<string, System>;
    systemsState: typeof SYSTEMS_STATE;

    ui: {
        shape: {
            registerContextMenuEntry: (entry: (shape: LocalId) => Section[]) => void;
            registerTab: (tab: PanelTab, filter: (shape: LocalId) => boolean) => void;
        };
    };

    getShape: (shape: LocalId) => IShape | undefined;
    getGlobalId: (id: LocalId) => GlobalId | undefined;
}

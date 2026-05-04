import type { ApiModMeta } from "../apiTypes";
import type { Section } from "../core/components/contextMenu/types";
import type { EventBus } from "../core/eventBus";
import type { HookSystem } from "../core/hooks";
import { type GlobalId, type LocalId } from "../core/id";
import type { SYSTEMS_STATE } from "../core/systems";
import type { System } from "../core/systems/models";
import type { IShape } from "../game/interfaces/shape";
import type { PanelTab } from "../game/systems/ui/types";

import type { ModDataBlockFunctions } from "./db";

export interface Mod {
    events?: {
        init?: (meta: ApiModMeta) => Promise<void>;
        initGame?: (data: ModLoad & ModDataBlockFunctions) => Promise<void>;
        loadLocation?: () => Promise<void>;
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

    eventBus: EventBus;
    hooks: HookSystem;
}

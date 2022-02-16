import { reactive } from "vue";
import type { DeepReadonly } from "vue";

import { SyncTo } from "../../../core/models/types";
import { sendShapeIsDoor, sendShapeDoorPermissions } from "../../api/emits/shape/options";
import { getGlobalId } from "../../id";
import type { LocalId } from "../../id";

import { canUse } from "./common";
import { DEFAULT_PERMISSIONS } from "./models";
import type { Access, Permissions } from "./models";

interface ReactiveDoorState {
    id: LocalId | undefined;
    enabled: boolean;
    permissions?: Permissions;
}

class DoorSystem {
    private enabled: Set<LocalId> = new Set();
    private permissions: Map<LocalId, Permissions> = new Map();

    // REACTIVE STATE

    private _state: ReactiveDoorState;

    constructor() {
        this._state = reactive({
            id: undefined,
            enabled: false,
        });
    }

    get state(): DeepReadonly<ReactiveDoorState> {
        return this._state;
    }

    loadState(id: LocalId): void {
        this._state.id = id;
        this._state.enabled = this.enabled.has(id);
        this._state.permissions = this.permissions.get(id);
    }

    dropState(): void {
        this._state.id = undefined;
    }

    // BEHAVIOUR

    // Inform the system about the state of a certain LocalId
    inform(id: LocalId, enabled: boolean, permissions?: Permissions): void {
        if (enabled) {
            this.enabled.add(id);
        }
        this.permissions.set(id, permissions ?? DEFAULT_PERMISSIONS);
    }

    toggle(id: LocalId, enabled: boolean, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendShapeIsDoor({ shape: getGlobalId(id), value: enabled });
        if (this._state.id === id) this._state.enabled = enabled;

        if (enabled) {
            this.enabled.add(id);
        } else {
            this.enabled.delete(id);
        }
    }

    isDoor(id: LocalId): boolean {
        return this.enabled.has(id);
    }

    getPermissions(id: LocalId): Readonly<Permissions> | undefined {
        return this.permissions.get(id);
    }

    setPermissions(id: LocalId, permissions: Permissions, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendShapeDoorPermissions({ shape: getGlobalId(id), value: permissions });
        if (this._state.id === id) this._state.permissions = permissions;

        this.permissions.set(id, permissions);
    }

    canUse(id: LocalId): Access {
        return canUse(id, "door");
    }

    getDoors(): Readonly<IterableIterator<LocalId>> {
        return this.enabled.values();
    }
}

export const doorSystem = new DoorSystem();

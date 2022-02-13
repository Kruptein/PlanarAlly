import { SyncTo } from "../../../core/models/types";
import { sendShapeIsDoor, sendShapePermissions } from "../../api/emits/shape/options";
import { getGlobalId } from "../../id";
import type { LocalId } from "../../id";

import { canUse } from "./common";
import { DEFAULT_PERMISSIONS } from "./models";
import type { Access } from "./models";
import type { Permissions } from "./models";

class DoorSystem {
    private enabled: Set<LocalId> = new Set();
    private permissions: Map<LocalId, Permissions> = new Map();

    inform(id: LocalId, enabled: boolean, permissions?: Permissions): void {
        if (enabled) {
            this.enabled.add(id);
        }
        this.permissions.set(id, permissions ?? DEFAULT_PERMISSIONS);
    }

    toggle(id: LocalId, enabled: boolean, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendShapeIsDoor({ shape: getGlobalId(id), value: enabled });

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
        if (syncTo === SyncTo.SERVER) sendShapePermissions({ shape: getGlobalId(id), value: permissions });
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

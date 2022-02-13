import { reactive } from "vue";
import type { DeepReadonly } from "vue";

import { SyncTo } from "../../../core/models/types";
import type { GlobalId, LocalId } from "../../id";

import { copyPermissions } from "./common";
import { doorSystem } from "./door";
import type { Permissions } from "./models";
import { teleportZoneSystem } from "./teleportZone";

interface State {
    door: {
        enabled: boolean;
        permissions?: Permissions;
    };
    tp: {
        enabled: boolean;
        permissions?: Permissions;
        immediate: boolean;
        target?: {
            locationId: number;
            spawnUuid: GlobalId;
        };
    };
}

class ReactiveLogic {
    private id: LocalId | undefined;
    private _state: State;

    constructor() {
        this._state = reactive({
            door: {
                enabled: false,
                permissions: undefined,
            },
            tp: {
                enabled: false,
                permissions: undefined,
                immediate: false,
                target: undefined,
            },
        });
    }

    get state(): DeepReadonly<State> {
        return this._state;
    }

    reset(): void {
        if (this.id === undefined) return;

        this.id = undefined;
        this._state.door.enabled = false;
        this._state.door.permissions = undefined;
    }

    load(id: LocalId): void {
        this.id = id;
        this._state.door.enabled = doorSystem.isDoor(id);
        const permissions = doorSystem.getPermissions(id);
        this._state.door.permissions = permissions ? copyPermissions(permissions) : undefined;
    }

    // DOOR

    get isDoor(): boolean {
        return this._state.door.enabled;
    }

    setIsDoor(enabled: boolean, syncTo: SyncTo): void {
        if (this.id === undefined) return;

        this._state.door.enabled = enabled;

        if (syncTo !== SyncTo.UI) {
            doorSystem.toggle(this.id, enabled, syncTo);
        }
    }

    setDoorPermissions(permissions: Permissions, syncTo: SyncTo): void {
        if (this.id === undefined) return;

        this._state.door.permissions = permissions;

        if (syncTo !== SyncTo.UI) {
            doorSystem.setPermissions(this.id, permissions, syncTo);
        }
    }

    // TP ZONE

    get isTeleportZone(): boolean {
        return this.state.tp.enabled;
    }

    setIsTeleportZone(enabled: boolean, syncTo: SyncTo): void {
        if (this.id === undefined) return;

        this._state.tp.enabled = enabled;

        if (syncTo !== SyncTo.UI) {
            teleportZoneSystem.toggle(this.id, enabled, syncTo);
        }
    }

    setTeleportZonePermissions(): void {}
}

export const reactiveLogic = new ReactiveLogic();
(window as any).reactiveLogic = reactiveLogic;

import { reactive } from "vue";
import type { DeepReadonly } from "vue";

import { registerSystem } from "../..";
import type { System } from "../..";
import { FULL_SYNC } from "../../../../core/models/types";
import type { Sync } from "../../../../core/models/types";
import { getGlobalId, getShape } from "../../../id";
import type { LocalId } from "../../../id";
import { canUse } from "../common";
import { DEFAULT_PERMISSIONS } from "../models";
import type { Access, Permissions } from "../models";

import { sendShapeIsDoor, sendShapeDoorPermissions, sendShapeDoorToggleMode } from "./emits";
import type { DoorOptions, DOOR_TOGGLE_MODE } from "./models";

const DEFAULT_OPTIONS: () => DoorOptions = () => ({
    permissions: DEFAULT_PERMISSIONS(),
    toggleMode: "both",
});

interface ReactiveDoorState {
    id: LocalId | undefined;
    enabled: boolean;
    permissions?: Permissions;
    toggleMode: DOOR_TOGGLE_MODE;
}

class DoorSystem implements System {
    private enabled: Set<LocalId> = new Set();
    private data: Map<LocalId, DoorOptions> = new Map();

    // REACTIVE STATE

    private _state: ReactiveDoorState;

    constructor() {
        this._state = reactive({
            id: undefined,
            enabled: false,
            toggleMode: "both",
        });
    }

    get state(): DeepReadonly<ReactiveDoorState> {
        return this._state;
    }

    loadState(id: LocalId): void {
        const data = this.data.get(id) ?? DEFAULT_OPTIONS();
        this._state.id = id;
        this._state.enabled = this.enabled.has(id);
        this._state.permissions = data.permissions;
        this._state.toggleMode = data.toggleMode;
    }

    dropState(): void {
        this._state.id = undefined;
    }

    // BEHAVIOUR

    clear(): void {
        this.dropState();
        this.enabled.clear();
        this.data.clear();
    }

    // Inform the system about the state of a certain LocalId
    inform(id: LocalId, enabled: boolean, options?: DoorOptions, syncToServer = false): void {
        if (enabled) {
            this.enabled.add(id);
        }
        this.data.set(id, { ...DEFAULT_OPTIONS(), ...options });

        if (syncToServer) {
            const options = this.data.get(id)!;
            const shape = getGlobalId(id);
            sendShapeIsDoor({ shape, value: enabled });
            if (options.permissions) sendShapeDoorPermissions({ shape, value: options.permissions });
            if (options.toggleMode !== "both") sendShapeDoorToggleMode({ shape, value: options.toggleMode });
        }
    }

    drop(id: LocalId): void {
        this.enabled.delete(id);
        this.data.delete(id);
        if (this._state.id === id) {
            this.dropState();
        }
    }

    toggle(id: LocalId, enabled: boolean, syncTo: Sync): void {
        if (syncTo.server) sendShapeIsDoor({ shape: getGlobalId(id), value: enabled });
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
        return this.data.get(id)?.permissions;
    }

    setPermissions(id: LocalId, permissions: Permissions, syncTo: Sync): void {
        let options = this.data.get(id);
        if (options === undefined) {
            options = DEFAULT_OPTIONS();
            this.data.set(id, options);
        }

        if (syncTo.server) sendShapeDoorPermissions({ shape: getGlobalId(id), value: permissions });
        if (this._state.id === id) this._state.permissions = permissions;

        options.permissions = permissions;
    }

    setToggleMode(id: LocalId, mode: DOOR_TOGGLE_MODE, syncTo: Sync): void {
        let options = this.data.get(id);
        if (options === undefined) {
            options = DEFAULT_OPTIONS();
            this.data.set(id, options);
        }

        if (syncTo.server) sendShapeDoorToggleMode({ shape: getGlobalId(id), value: mode });
        if (this._state.id === id) this._state.toggleMode = mode;

        options.toggleMode = mode;
    }

    toggleDoor(id: LocalId): undefined {
        const shape = getShape(id);
        const options = this.data.get(id);
        if (shape === undefined || options === undefined) return;

        if (options.toggleMode === "both") {
            shape.setBlocksMovement(!shape.blocksMovement, FULL_SYNC, true);
            shape.setBlocksVision(!shape.blocksVision, FULL_SYNC, true);
        } else if (options.toggleMode === "movement") {
            shape.setBlocksMovement(!shape.blocksMovement, FULL_SYNC, true);
        } else {
            shape.setBlocksVision(!shape.blocksVision, FULL_SYNC, true);
        }
    }

    getCursorState(id: LocalId): "lock-solid" | "lock-open-solid" | "eye-solid" | "eye-slash-solid" | undefined {
        const shape = getShape(id);
        const options = this.data.get(id);
        if (shape === undefined || options === undefined) return;

        if (options.toggleMode === "vision") {
            return shape.blocksVision ? "eye-solid" : "eye-slash-solid";
        }
        return shape.blocksMovement ? "lock-open-solid" : "lock-solid";
    }

    canUse(id: LocalId): Access {
        return canUse(id, "door");
    }

    getDoors(): Readonly<IterableIterator<LocalId>> {
        return this.enabled.values();
    }
}

export const doorSystem = new DoorSystem();
registerSystem("door", doorSystem);

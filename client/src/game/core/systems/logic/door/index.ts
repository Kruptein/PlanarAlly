import type { DeepReadonly } from "vue";

import { registerSystem } from "../..";
import type { ShapeSystem } from "../..";
import { baseAdjust } from "../../../../../core/http";
import { FULL_SYNC } from "../../../../../core/models/types";
import type { Sync } from "../../../../../core/models/types";
import { selectToolState } from "../../../../dom/tools/variants/select/state";
import { getGlobalId } from "../../../id";
import type { LocalId } from "../../../id";
import type { PlayerId } from "../../players/models";
import { propertiesSystem } from "../../properties";
import { getProperties } from "../../properties/state";
import { canUse } from "../common";
import type { Access, Permissions } from "../models";

import { sendShapeIsDoor, sendShapeDoorPermissions, sendShapeDoorToggleMode } from "./emits";
import type { DoorOptions, DOOR_TOGGLE_MODE } from "./models";
import { doorLogicState } from "./state";

const { readonly, mutable, mutableReactive: $, dropState, DEFAULT_OPTIONS } = doorLogicState;

class DoorSystem implements ShapeSystem {
    // BEHAVIOUR

    clear(): void {
        dropState();
        mutable.enabled.clear();
        mutable.data.clear();
    }

    // Inform the system about the state of a certain LocalId
    inform(id: LocalId, enabled: boolean, options?: DoorOptions, syncToServer = false): void {
        if (enabled) {
            mutable.enabled.add(id);
        }
        mutable.data.set(id, { ...DEFAULT_OPTIONS(), ...options });

        if (syncToServer) {
            const options = readonly.data.get(id)!;
            const shape = getGlobalId(id);
            if (shape) {
                sendShapeIsDoor({ shape, value: enabled });
                if (options.permissions) sendShapeDoorPermissions({ shape, value: options.permissions });
                if (options.toggleMode !== "both") sendShapeDoorToggleMode({ shape, value: options.toggleMode });
            }
        }
    }

    drop(id: LocalId): void {
        mutable.enabled.delete(id);
        mutable.data.delete(id);
        if ($.id === id) {
            dropState();
        }
    }

    toggle(id: LocalId, enabled: boolean, syncTo: Sync): void {
        if (syncTo.server) {
            const shape = getGlobalId(id);
            if (shape) sendShapeIsDoor({ shape, value: enabled });
        }
        if ($.id === id) $.enabled = enabled;

        if (enabled) {
            mutable.enabled.add(id);
        } else {
            mutable.enabled.delete(id);
        }
    }

    isDoor(id: LocalId): boolean {
        return readonly.enabled.has(id);
    }

    getPermissions(id: LocalId): DeepReadonly<Permissions> | undefined {
        return readonly.data.get(id)?.permissions;
    }

    setPermissions(id: LocalId, permissions: Permissions, syncTo: Sync): void {
        let options = mutable.data.get(id);
        if (options === undefined) {
            options = DEFAULT_OPTIONS();
            mutable.data.set(id, options);
        }

        if (syncTo.server) {
            const shape = getGlobalId(id);
            if (shape) sendShapeDoorPermissions({ shape, value: permissions });
        }
        if ($.id === id) $.permissions = permissions;

        options.permissions = permissions;
    }

    setToggleMode(id: LocalId, mode: DOOR_TOGGLE_MODE, syncTo: Sync): void {
        let options = mutable.data.get(id);
        if (options === undefined) {
            options = DEFAULT_OPTIONS();
            mutable.data.set(id, options);
        }

        if (syncTo.server) {
            const shape = getGlobalId(id);
            if (shape) sendShapeDoorToggleMode({ shape, value: mode });
        }
        if ($.id === id) $.toggleMode = mode;

        options.toggleMode = mode;
    }

    toggleDoor(id: LocalId): undefined {
        const props = getProperties(id);
        const options = readonly.data.get(id);
        if (props === undefined || options === undefined) return;

        if (options.toggleMode === "both") {
            propertiesSystem.setBlocksMovement(id, !props.blocksMovement, FULL_SYNC, true);
            propertiesSystem.setBlocksVision(id, !props.blocksVision, FULL_SYNC, true);
        } else if (options.toggleMode === "movement") {
            propertiesSystem.setBlocksMovement(id, !props.blocksMovement, FULL_SYNC, true);
        } else {
            propertiesSystem.setBlocksVision(id, !props.blocksVision, FULL_SYNC, true);
        }

        this.checkCursorState(id);
    }

    checkCursorState(id: LocalId): void {
        const hoverId = selectToolState._.hoveredDoor;
        if (id === hoverId) {
            const state = this.getCursorState(hoverId);
            if (state !== undefined) {
                document.body.style.cursor = `url('${baseAdjust(`static/img/${state}.svg`)}') 16 16, auto`;
            }
        }
    }

    getCursorState(id: LocalId): "lock-solid" | "lock-open-solid" | "eye-solid" | "eye-slash-solid" | undefined {
        const props = getProperties(id);
        const options = readonly.data.get(id);
        if (props === undefined || options === undefined) return;

        if (options.toggleMode === "vision") {
            return props.blocksVision ? "eye-solid" : "eye-slash-solid";
        }
        return props.blocksMovement ? "lock-open-solid" : "lock-solid";
    }

    canUse(id: LocalId, playerId: PlayerId): Access {
        return canUse(id, "door", playerId);
    }

    getDoors(): Readonly<IterableIterator<LocalId>> {
        return readonly.enabled.values();
    }
}

export const doorSystem = new DoorSystem();
registerSystem("door", doorSystem, true);

import type { DeepReadonly } from "vue";

import type { ApiCoreShape } from "../../../../apiTypes";
import { baseAdjust } from "../../../../core/http";
import type { LocalId } from "../../../../core/id";
import { FULL_SYNC } from "../../../../core/models/types";
import type { Sync } from "../../../../core/models/types";
import { registerSystem } from "../../../../core/systems";
import type { ShapeSystem, SystemInformMode } from "../../../../core/systems/models";
import { Colour, registerColour } from "../../../colour";
import { getGlobalId } from "../../../id";
import type { ServerShapeOptions } from "../../../models/shapes";
import { selectToolState } from "../../../tools/variants/select/state";
import type { PlayerId } from "../../players/models";
import { propertiesSystem } from "../../properties";
import { getProperties } from "../../properties/state";
import { VisionBlock } from "../../properties/types";
import { playerSettingsState } from "../../settings/players/state";
import { canUse } from "../common";
import type { Access, Permissions } from "../models";

import { sendShapeIsDoor, sendShapeDoorPermissions, sendShapeDoorToggleMode } from "./emits";
import type { DoorOptions, DOOR_TOGGLE_MODE } from "./models";
import { doorLogicState } from "./state";

const { readonly, mutable, mutableReactive: $, dropState, DEFAULT_OPTIONS } = doorLogicState;

class DoorSystem implements ShapeSystem<{ enabled: boolean; options?: DoorOptions }> {
    constructor() {
        // Ensure that toggling doors keeps the correct colour
        registerColour(Colour.Door, (id: LocalId | undefined) => {
            const closed = playerSettingsState.raw.defaultClosedDoorColour.value;
            if (id === undefined) return closed;

            const props = getProperties(id);
            // The shape does not exist?
            if (props === undefined) return closed;

            const data = readonly.data.get(id);
            // Probably not yet registered during draw calls
            if (data === undefined) return closed;

            if (props.blocksMovement) {
                if (data.toggleMode !== "vision") return closed;
            } else if (props.blocksVision !== VisionBlock.No) {
                if (data.toggleMode !== "movement") return closed;
            }
            return playerSettingsState.raw.defaultOpenDoorColour.value;
        });
    }

    // CORE

    clear(): void {
        dropState();
        mutable.enabled.clear();
        mutable.data.clear();
    }

    drop(id: LocalId): void {
        mutable.enabled.delete(id);
        mutable.data.delete(id);
        if ($.id === id) {
            dropState();
        }
    }

    importLate(id: LocalId, data: { enabled: boolean; options?: DoorOptions }, mode: SystemInformMode): void {
        if (data.enabled) {
            mutable.enabled.add(id);
        }
        const options = { ...DEFAULT_OPTIONS(), ...data.options };
        mutable.data.set(id, options);

        if (mode !== "load") {
            const shape = getGlobalId(id);
            if (shape) {
                sendShapeIsDoor({ shape, value: data.enabled });
                if (options.permissions) sendShapeDoorPermissions({ shape, value: options.permissions });
                if (options.toggleMode !== "both") sendShapeDoorToggleMode({ shape, value: options.toggleMode });
            }
        }
    }

    export(id: LocalId): { enabled: boolean; options?: DoorOptions } {
        return { enabled: readonly.enabled.has(id), options: mutable.data.get(id)! };
    }

    toServerShape(id: LocalId, shape: ApiCoreShape): void {
        const data = this.export(id);
        shape.is_door = data.enabled;
    }

    fromServerShape(
        shape: ApiCoreShape,
        serverOptions: Partial<ServerShapeOptions>,
    ): { enabled: boolean; options?: DoorOptions } {
        return { enabled: shape.is_door, options: serverOptions.door };
    }

    // BEHAVIOUR

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

    private toggleMovement(id: LocalId, blocksMovement: boolean): void {
        propertiesSystem.setBlocksMovement(id, !blocksMovement, FULL_SYNC, true);
    }

    private toggleVision(id: LocalId, blocksVision: VisionBlock): void {
        // Currently visionBlocking toggle will always toggle to BEHIND mode
        // As we're toggling this property we lose the original meaning if it was something else.
        // We could keep track of the original state in the shape options,
        // but I rather keep it simple unless it's a requested feature

        propertiesSystem.setBlocksVision(
            id,
            blocksVision !== VisionBlock.No ? VisionBlock.No : VisionBlock.Behind,
            FULL_SYNC,
            true,
        );
    }

    toggleDoor(id: LocalId): undefined {
        const props = getProperties(id);
        const options = readonly.data.get(id);
        if (props === undefined || options === undefined) return;

        if (options.toggleMode === "both") {
            this.toggleMovement(id, props.blocksMovement);
            this.toggleVision(id, props.blocksVision);
        } else if (options.toggleMode === "movement") {
            this.toggleMovement(id, props.blocksMovement);
        } else {
            this.toggleVision(id, props.blocksVision);
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
            return props.blocksVision !== VisionBlock.No ? "eye-solid" : "eye-slash-solid";
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

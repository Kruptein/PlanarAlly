import { reactive } from "vue";
import type { DeepReadonly } from "vue";
import { POSITION, useToast } from "vue-toastification";
import type { ToastID } from "vue-toastification/dist/types/types";

import SingleButtonToast from "../../../../core/components/toasts/SingleButtonToast.vue";
import type { LocalId } from "../../../../core/id";
import type { Sync } from "../../../../core/models/types";
import { registerSystem } from "../../../../core/systems";
import type { ShapeSystem } from "../../../../core/systems";
import { getGlobalId, getShape } from "../../../id";
import type { IShape } from "../../../interfaces/shape";
import { playerSystem } from "../../players";
import type { PlayerId } from "../../players/models";
import { getProperties } from "../../properties/state";
import { locationSettingsState } from "../../settings/location/state";
import { canUse } from "../common";
import { Access, DEFAULT_PERMISSIONS } from "../models";
import type { Permissions } from "../models";

import { getTpZoneShapes, validateTeleport } from "./core";
import {
    sendShapeIsImmediateTeleportZone,
    sendShapeIsTeleportZone,
    sendShapeTeleportZonePermissions,
    sendShapeTeleportZoneTarget,
} from "./emits";
import type { TeleportOptions } from "./models";

const toast = useToast();

type ClientTeleportOptions = TeleportOptions & {
    toastId?: ToastID;
};

const DEFAULT_OPTIONS: () => ClientTeleportOptions = () => ({
    permissions: DEFAULT_PERMISSIONS(),
    immediate: false,
    location: undefined,
    toastId: undefined,
});

interface ReactiveTpState {
    id: LocalId | undefined;
    enabled: boolean;
    permissions?: Permissions;
    immediate: boolean;
    target?: TeleportOptions["location"];
}

class TeleportZoneSystem implements ShapeSystem {
    private enabled = new Set<LocalId>();
    private data = new Map<LocalId, ClientTeleportOptions>();

    // REACTIVE STATE

    private _state: ReactiveTpState;

    constructor() {
        this._state = reactive({
            id: undefined,
            enabled: false,
            immediate: false,
        });
    }

    get state(): DeepReadonly<ReactiveTpState> {
        return this._state;
    }

    loadState(id: LocalId): void {
        this._state.id = id;
        this._state.enabled = this.enabled.has(id);
        const data = this.data.get(id);
        this._state.permissions = data?.permissions;
        this._state.immediate = data?.immediate ?? false;
        this._state.target = data?.location;
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
    inform(id: LocalId, enabled: boolean, options?: TeleportOptions): void {
        if (enabled) {
            this.enabled.add(id);
        }
        this.data.set(id, { ...DEFAULT_OPTIONS(), ...options });
    }

    drop(id: LocalId): void {
        this.enabled.delete(id);
        this.data.delete(id);
        if (this._state.id === id) {
            this.dropState();
        }
    }

    toggle(id: LocalId, enabled: boolean, syncTo: Sync): void {
        if (syncTo.server) {
            const shape = getGlobalId(id);
            if (shape) sendShapeIsTeleportZone({ shape, value: enabled });
        }
        if (this._state.id === id) this._state.enabled = enabled;

        if (enabled) {
            this.enabled.add(id);
        } else {
            this.enabled.delete(id);
        }
    }

    toggleImmediate(id: LocalId, immediate: boolean, syncTo: Sync): void {
        let options = this.data.get(id);
        if (options === undefined) {
            options = DEFAULT_OPTIONS();
            this.data.set(id, options);
        }

        if (syncTo.server) {
            const shape = getGlobalId(id);
            if (shape) sendShapeIsImmediateTeleportZone({ shape, value: immediate });
        }
        if (this._state.id === id) this._state.immediate = immediate;

        options.immediate = immediate;
    }

    isTeleportZone(id: LocalId): boolean {
        return this.enabled.has(id);
    }

    getPermissions(id: LocalId): Permissions | undefined {
        return this.data.get(id)?.permissions;
    }

    setPermissions(id: LocalId, permissions: Permissions, syncTo: Sync): void {
        let options = this.data.get(id);
        if (options === undefined) {
            options = DEFAULT_OPTIONS();
            this.data.set(id, options);
        }

        if (syncTo.server) {
            const shape = getGlobalId(id);
            if (shape) sendShapeTeleportZonePermissions({ shape, value: permissions });
        }
        if (this._state.id === id) this._state.permissions = permissions;
        options.permissions = permissions;
    }

    canUse(id: LocalId, playerId: PlayerId): Access {
        return canUse(id, "tp", playerId);
    }

    setTarget(id: LocalId, target: NonNullable<TeleportOptions["location"]>, syncTo: Sync): void {
        let options = this.data.get(id);
        if (options === undefined) {
            options = DEFAULT_OPTIONS();
            this.data.set(id, options);
        }

        if (syncTo.server) {
            const shape = getGlobalId(id);
            if (shape) sendShapeTeleportZoneTarget({ shape, value: target });
        }
        if (this._state.id === id) this._state.target = target;

        options.location = target;
    }

    async checkTeleport(shapes: readonly IShape[]): Promise<void> {
        for (const [tp, options] of this.data.entries()) {
            const shapesToMove: LocalId[] = [];
            const tpShape = getShape(tp);
            if (tpShape === undefined || options.location === undefined) continue;

            const access = this.canUse(tp, playerSystem.getCurrentPlayerId()!);
            if (access === Access.Disabled) {
                continue;
            }

            for (const shape of shapes) {
                if (
                    shape.id === tp ||
                    getProperties(shape.id)!.isLocked ||
                    locationSettingsState.raw.spawnLocations.value.includes(getGlobalId(shape.id)!)
                )
                    continue;
                if (tpShape.floor?.id === shape.floorId && tpShape.contains(shape.center)) {
                    shapesToMove.push(shape.id);
                }
            }

            if (shapesToMove.length > 0) {
                const toZone = options.location.spawnUuid;

                if (options.immediate) {
                    await validateTeleport(access, tp, toZone, shapesToMove);
                } else if (options.toastId === undefined) {
                    options.toastId = toast.info(
                        {
                            component: SingleButtonToast,
                            props: {
                                text: "Teleport Zone",
                                onClick: async () => await validateTeleport(access, tp, toZone, shapesToMove),
                            },
                        },
                        {
                            position: POSITION.TOP_RIGHT,
                            timeout: false,
                            closeOnClick: false,
                        },
                    );
                    continue;
                }
            } else if (options.toastId !== undefined) {
                const shapes = getTpZoneShapes(tp);
                if (shapes.length === 0) {
                    toast.dismiss(options.toastId);
                    options.toastId = undefined;
                }
            }
        }
    }
}

export const teleportZoneSystem = new TeleportZoneSystem();
registerSystem("tp", teleportZoneSystem, true);

import { reactive } from "vue";
import type { DeepReadonly } from "vue";
import { POSITION, useToast } from "vue-toastification";
import type { ToastID } from "vue-toastification/dist/types/types";

import { registerSystem } from "../..";
import type { System } from "../..";
import SingleButtonToast from "../../../../core/components/toasts/SingleButtonToast.vue";
import type { Sync } from "../../../../core/models/types";
import { floorStore } from "../../../../store/floor";
import { gameStore } from "../../../../store/game";
import { settingsStore } from "../../../../store/settings";
import { sendRequest } from "../../../api/emits/logic";
import { requestShapeInfo, sendShapesMove } from "../../../api/emits/shape/core";
import { getGlobalId, getLocalId, getShape } from "../../../id";
import type { GlobalId, LocalId } from "../../../id";
import { LayerName } from "../../../models/floor";
import { setCenterPosition } from "../../../position";
import type { IShape } from "../../../shapes/interfaces";
import { accessSystem } from "../../access";
import { canUse } from "../common";
import { Access, DEFAULT_PERMISSIONS } from "../models";
import type { Permissions } from "../models";

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

class TeleportZoneSystem implements System {
    private enabled: Set<LocalId> = new Set();
    private data: Map<LocalId, ClientTeleportOptions> = new Map();

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
        if (syncTo.server) sendShapeIsTeleportZone({ shape: getGlobalId(id), value: enabled });
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

        if (syncTo.server) sendShapeIsImmediateTeleportZone({ shape: getGlobalId(id), value: immediate });
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

        if (syncTo.server) sendShapeTeleportZonePermissions({ shape: getGlobalId(id), value: permissions });
        if (this._state.id === id) this._state.permissions = permissions;
        options.permissions = permissions;
    }

    canUse(id: LocalId): Access {
        return canUse(id, "tp");
    }

    setTarget(id: LocalId, target: TeleportOptions["location"], syncTo: Sync): void {
        let options = this.data.get(id);
        if (options === undefined) {
            options = DEFAULT_OPTIONS();
            this.data.set(id, options);
        }

        if (syncTo.server) sendShapeTeleportZoneTarget({ shape: getGlobalId(id), value: target });
        if (this._state.id === id) this._state.target = target;

        options.location = target;
    }

    async checkTeleport(shapes: readonly IShape[]): Promise<void> {
        for (const [tp, options] of this.data.entries()) {
            const shapesToMove: LocalId[] = [];
            const tpShape = getShape(tp);
            if (tpShape === undefined || options.location === undefined) continue;

            const access = this.canUse(tp);
            if (access === Access.Disabled) {
                continue;
            }

            for (const shape of shapes) {
                if (
                    shape.isLocked ||
                    (settingsStore.currentLocationOptions.value.spawnLocations?.includes(shape.id) ?? false) ||
                    shape.id === tp
                )
                    continue;
                if (tpShape.floor.id === shape.floor.id && tpShape.contains(shape.center())) {
                    shapesToMove.push(shape.id);
                }
            }

            if (shapesToMove.length > 0) {
                const toZone = options.location.spawnUuid;

                if (options.immediate) {
                    if (access === Access.Request) {
                        toast.info("Request to use teleport zone sent", {
                            position: POSITION.TOP_RIGHT,
                        });
                        sendRequest({
                            fromZone: getGlobalId(tp),
                            toZone,
                            transfers: shapesToMove.map((s) => getGlobalId(s)),
                            logic: "tp",
                        });
                    } else {
                        await teleport(tp, toZone, shapesToMove);
                    }
                } else if (options.toastId === undefined) {
                    options.toastId = toast.info(
                        {
                            component: SingleButtonToast,
                            props: {
                                text: "Teleport Zone",
                                onClick: async () => await teleport(tp, toZone),
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

function getTpZoneShapes(fromZone: LocalId): LocalId[] {
    const tokenLayer = floorStore.getLayer(floorStore.currentFloor.value!, LayerName.Tokens)!;
    const shapes: LocalId[] = [];
    const fromShape = getShape(fromZone);
    if (fromShape === undefined) return [];

    for (const shape of tokenLayer.getShapes({ includeComposites: true })) {
        if (
            !shape.isLocked &&
            accessSystem.hasAccessTo(shape.id, false, { movement: true }) &&
            fromShape.contains(shape.center())
        ) {
            shapes.push(shape.id);
        }
    }
    return shapes;
}

export async function teleport(fromZone: LocalId, toZone: GlobalId, transfers?: readonly LocalId[]): Promise<void> {
    const activeLocation = settingsStore.state.activeLocation;
    const tpTargetId = getLocalId(toZone);
    const tpTargetShape = tpTargetId === undefined ? undefined : getShape(tpTargetId);
    let target: { location: number; floor: string; x: number; y: number };
    if (tpTargetShape === undefined) {
        const { location, shape } = await requestShapeInfo(toZone);
        target = {
            location,
            floor: shape.floor,
            x: shape.x,
            y: shape.y,
        };
    } else {
        target = {
            location: activeLocation,
            floor: tpTargetShape.floor.name,
            x: tpTargetShape.refPoint.x,
            y: tpTargetShape.refPoint.y,
        };
    }

    const shapes = transfers ? transfers : getTpZoneShapes(fromZone);
    if (shapes.length === 0) return;

    sendShapesMove({
        shapes: shapes.map((s) => getGlobalId(s)),
        target,
        tp_zone: true,
    });
    const { location, ...position } = target;
    if (settingsStore.movePlayerOnTokenChange.value) {
        if (location === activeLocation) {
            setCenterPosition(tpTargetShape!.center());
        } else {
            const users: Set<string> = new Set();
            for (const sh of shapes) {
                for (const owner of accessSystem.getOwners(sh)) users.add(owner);
            }
            gameStore.updatePlayersLocation([...users], location, true, position);
        }
    }
}

export const teleportZoneSystem = new TeleportZoneSystem();
registerSystem("tp", teleportZoneSystem);

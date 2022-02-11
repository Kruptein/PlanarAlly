import type { DeepReadonly } from "vue";
import { POSITION, useToast } from "vue-toastification";
import type { ToastID } from "vue-toastification/dist/types/types";

import SingleButtonToast from "../core/components/toasts/SingleButtonToast.vue";
import { Store } from "../core/store";
import { sendRequest } from "../game/api/emits/logic";
import { requestShapeInfo, sendShapesMove } from "../game/api/emits/shape/core";
import { getGlobalId, getLocalId, getShape } from "../game/id";
import type { GlobalId, LocalId } from "../game/id";
import { LayerName } from "../game/models/floor";
import type { Conditions, LOGIC_TYPES } from "../game/models/logic";
import { DEFAULT_CONDITIONS } from "../game/models/logic";
import { setCenterPosition } from "../game/position";
import type { IShape } from "../game/shapes/interfaces";

import { coreStore } from "./core";
import { floorStore } from "./floor";
import { gameStore } from "./game";
import { settingsStore } from "./settings";

const toast = useToast();

interface LogicState {
    doors: Set<LocalId>;
    teleportZones: Record<LocalId, ToastID | undefined>;
}

export enum Access {
    Enabled,
    Request,
    Disabled,
}

export function copyConditions(conditions: DeepReadonly<Conditions>): Conditions {
    return {
        enabled: [...conditions.enabled],
        request: [...conditions.request],
        disabled: [...conditions.disabled],
    };
}

class LogicStore extends Store<LogicState> {
    protected data(): LogicState {
        return {
            doors: new Set(),
            teleportZones: {},
        };
    }

    addDoor(shape: LocalId): void {
        this._state.doors.add(shape);
    }

    removeDoor(shape: LocalId): void {
        this._state.doors.delete(shape);
    }

    addTeleportZone(shape: LocalId): void {
        this._state.teleportZones[shape] = undefined;
    }

    removeTeleportZone(shape: LocalId): void {
        const toastId = this._state.teleportZones[shape];
        if (toastId !== undefined) toast.dismiss(toastId);
        delete this._state.teleportZones[shape];
    }

    canUse(shape: IShape, target: LOGIC_TYPES): Access {
        if ((target === "door" && !shape.isDoor) || (target === "tp" && !shape.isTeleportZone)) return Access.Disabled;
        if (!gameStore.state.isDm) {
            const conditions =
                target === "door"
                    ? shape.options.doorConditions
                    : shape.options.teleport?.conditions ?? DEFAULT_CONDITIONS;
            if (conditions === undefined) return Access.Disabled;
            // First specific user permissions
            if (conditions.enabled.includes(coreStore.state.username)) return Access.Enabled;
            if (conditions.request.includes(coreStore.state.username)) return Access.Request;
            if (conditions.disabled.includes(coreStore.state.username)) return Access.Disabled;
            // Check default permissions
            if (conditions.enabled.includes("default")) return Access.Enabled;
            if (conditions.request.includes("default")) return Access.Request;
            if (conditions.disabled.includes("default")) return Access.Disabled;
        }
        return Access.Enabled;
    }

    async checkTeleport(shapes: readonly IShape[]): Promise<void> {
        for (const [tp, toastId] of Object.entries(this._state.teleportZones)) {
            const shapesToMove: LocalId[] = [];
            const tpShape = getShape(tp as unknown as LocalId);
            if (tpShape === undefined || tpShape.options.teleport?.location === undefined) continue;

            const canUse = this.canUse(tpShape, "tp");
            if (canUse === Access.Disabled) {
                continue;
            }

            for (const shape of shapes) {
                if (
                    shape.isLocked ||
                    (settingsStore.currentLocationOptions.value.spawnLocations?.includes(shape.id) ?? false) ||
                    shape.id === tpShape.id
                )
                    continue;
                if (tpShape.contains(shape.center())) {
                    shapesToMove.push(shape.id);
                }
            }

            if (shapesToMove.length > 0) {
                const zone = tpShape.options.teleport.location.spawnUuid;

                if (tpShape.options.teleport.immediate) {
                    if (canUse === Access.Request) {
                        toast.info("Request to use teleport zone sent", {
                            position: POSITION.TOP_RIGHT,
                        });
                        sendRequest({
                            fromZone: getGlobalId(tpShape.id),
                            toZone: zone,
                            transfers: shapesToMove.map((s) => getGlobalId(s)),
                            logic: "tp",
                        });
                    } else {
                        await this.teleport(tpShape.id, zone, shapesToMove);
                    }
                } else if (toastId === undefined) {
                    this._state.teleportZones[tpShape.id] = toast.info(
                        {
                            component: SingleButtonToast,
                            props: {
                                text: "Teleport Zone",
                                onClick: async () => await this.teleport(tpShape.id, zone),
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
            } else if (toastId !== undefined) {
                const shapes = this.getTpZoneShapes(tpShape.id);
                if (shapes.length === 0) {
                    toast.dismiss(toastId);
                    this._state.teleportZones[tpShape.id] = undefined;
                }
            }
        }
    }

    getTpZoneShapes(fromZone: LocalId): LocalId[] {
        const tokenLayer = floorStore.getLayer(floorStore.currentFloor.value!, LayerName.Tokens)!;
        const shapes: LocalId[] = [];
        const fromShape = getShape(fromZone);
        if (fromShape === undefined) return [];

        for (const shape of tokenLayer.getShapes({ includeComposites: true })) {
            if (
                !shape.isLocked &&
                shape.ownedBy(false, { movementAccess: true }) &&
                fromShape.contains(shape.center())
            ) {
                shapes.push(shape.id);
            }
        }
        return shapes;
    }

    async teleport(fromZone: LocalId, toZone: GlobalId, transfers?: readonly LocalId[]): Promise<void> {
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

        const shapes = transfers ? transfers : this.getTpZoneShapes(fromZone);
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
                    const shape = getShape(sh);
                    if (shape === undefined) continue;
                    for (const owner of shape.owners) users.add(owner.user);
                }
                gameStore.updatePlayersLocation([...users], location, true, position);
            }
        }
    }
}

export const logicStore = new LogicStore();
(window as any).logicStore = logicStore;

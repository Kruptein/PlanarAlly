import type { DeepReadonly } from "vue";
import { POSITION, useToast } from "vue-toastification";
import type { ToastID } from "vue-toastification/dist/types/types";

import SingleButtonToast from "../core/components/toasts/SingleButtonToast.vue";
import { Store } from "../core/store";
import { sendRequest } from "../game/api/emits/logic";
import { requestShapeInfo, sendShapesMove } from "../game/api/emits/shape/core";
import { LayerName } from "../game/models/floor";
import type { Conditions, LOGIC_TYPES } from "../game/models/logic";
import { DEFAULT_CONDITIONS } from "../game/models/logic";
import { setCenterPosition } from "../game/position";
import type { IShape } from "../game/shapes/interfaces";

import { coreStore } from "./core";
import { floorStore } from "./floor";
import { gameStore } from "./game";
import { settingsStore } from "./settings";
import { UuidMap } from "./shapeMap";

const toast = useToast();

interface LogicState {
    doors: Set<string>;
    teleportZones: Record<string, ToastID | undefined>;
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

    addDoor(shape: string): void {
        this._state.doors.add(shape);
    }

    removeDoor(shape: string): void {
        this._state.doors.delete(shape);
    }

    addTeleportZone(shape: string): void {
        this._state.teleportZones[shape] = undefined;
    }

    removeTeleportZone(shape: string): void {
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
            const shapesToMove: string[] = [];
            const tpShape = UuidMap.get(tp);
            if (tpShape === undefined || tpShape.options.teleport?.location === undefined) continue;

            const canUse = this.canUse(tpShape, "tp");
            if (canUse === Access.Disabled) {
                continue;
            }

            for (const shape of shapes) {
                if (
                    shape.isLocked ||
                    (settingsStore.currentLocationOptions.value.spawnLocations?.includes(shape.uuid) ?? false) ||
                    shape.uuid === tpShape.uuid
                )
                    continue;
                if (tpShape.contains(shape.center())) {
                    shapesToMove.push(shape.uuid);
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
                            fromZone: tpShape.uuid,
                            toZone: zone,
                            transfers: shapesToMove,
                            logic: "tp",
                        });
                    } else {
                        await this.teleport(tpShape.uuid, zone, shapesToMove);
                    }
                } else if (toastId === undefined) {
                    this._state.teleportZones[tpShape.uuid] = toast.info(
                        {
                            component: SingleButtonToast,
                            props: {
                                text: "Teleport Zone",
                                onClick: async () => await this.teleport(tpShape.uuid, zone),
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
                const shapes = this.getTpZoneShapes(tpShape.uuid);
                if (shapes.length === 0) {
                    toast.dismiss(toastId);
                    this._state.teleportZones[tpShape.uuid] = undefined;
                }
            }
        }
    }

    getTpZoneShapes(fromZone: string): string[] {
        const tokenLayer = floorStore.getLayer(floorStore.currentFloor.value!, LayerName.Tokens)!;
        const shapes = [];
        const fromShape = UuidMap.get(fromZone);
        if (fromShape === undefined) return [];

        for (const shape of tokenLayer.getShapes({ includeComposites: true })) {
            if (
                !shape.isLocked &&
                shape.ownedBy(false, { movementAccess: true }) &&
                fromShape.contains(shape.center())
            ) {
                shapes.push(shape.uuid);
            }
        }
        return shapes;
    }

    async teleport(fromZone: string, toZone: string, transfers?: readonly string[]): Promise<void> {
        const activeLocation = settingsStore.state.activeLocation;
        const tpTargetShape = UuidMap.get(toZone);
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
            shapes,
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
                    const shape = UuidMap.get(sh);
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

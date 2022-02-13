import { POSITION, useToast } from "vue-toastification";
import type { ToastID } from "vue-toastification/dist/types/types";

import SingleButtonToast from "../../../core/components/toasts/SingleButtonToast.vue";
import type { SyncTo } from "../../../core/models/types";
import { floorStore } from "../../../store/floor";
import { gameStore } from "../../../store/game";
import { settingsStore } from "../../../store/settings";
import { sendRequest } from "../../api/emits/logic";
import { requestShapeInfo, sendShapesMove } from "../../api/emits/shape/core";
import { getGlobalId, getLocalId, getShape } from "../../id";
import type { GlobalId, LocalId } from "../../id";
import { LayerName } from "../../models/floor";
import { setCenterPosition } from "../../position";
import type { IShape } from "../../shapes/interfaces";

import { canUse } from "./common";
import type { Permissions, TeleportOptions } from "./models";
import { Access, DEFAULT_PERMISSIONS } from "./models";

const toast = useToast();

type ClientTeleportOptions = TeleportOptions & {
    toastId?: ToastID;
};

const DEFAULT_OPTIONS: ClientTeleportOptions = {
    conditions: DEFAULT_PERMISSIONS,
    immediate: false,
    location: undefined,
    toastId: undefined,
};

class TeleportZoneSystem {
    private enabled: Set<LocalId> = new Set();
    private data: Map<LocalId, ClientTeleportOptions> = new Map();

    // Inform the system about the state of a certain LocalId
    inform(id: LocalId, enabled: boolean, options?: TeleportOptions): void {
        if (enabled) {
            this.enabled.add(id);
        }
        this.data.set(id, options ?? DEFAULT_OPTIONS);
    }

    toggle(id: LocalId, enabled: boolean, syncTo: SyncTo): void {
        if (enabled) {
            this.enabled.add(id);
        } else {
            this.enabled.delete(id);
        }
    }

    isTeleportZone(id: LocalId): boolean {
        return this.enabled.has(id);
    }

    getPermissions(id: LocalId): Permissions | undefined {
        return this.data.get(id)?.conditions;
    }

    canUse(id: LocalId): Access {
        return canUse(id, "tp");
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
                if (tpShape.contains(shape.center())) {
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
        if (!shape.isLocked && shape.ownedBy(false, { movementAccess: true }) && fromShape.contains(shape.center())) {
            shapes.push(shape.id);
        }
    }
    return shapes;
}

async function teleport(fromZone: LocalId, toZone: GlobalId, transfers?: readonly LocalId[]): Promise<void> {
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
                const shape = getShape(sh);
                if (shape === undefined) continue;
                for (const owner of shape.owners) users.add(owner.user);
            }
            gameStore.updatePlayersLocation([...users], location, true, position);
        }
    }
}

export const teleportZoneSystem = new TeleportZoneSystem();

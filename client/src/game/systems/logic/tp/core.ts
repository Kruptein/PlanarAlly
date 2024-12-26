import { POSITION, useToast } from "vue-toastification";

import { toArrayP, toGP } from "../../../../core/geometry";
import type { LocalId, GlobalId } from "../../../../core/id";
import { sendRequest } from "../../../api/emits/logic";
import { sendSetPlayersPosition } from "../../../api/emits/players";
import { requestShapeInfo, sendShapesMove } from "../../../api/emits/shape/core";
import { getShape, getLocalId, getGlobalId } from "../../../id";
import { LayerName } from "../../../models/floor";
import { Role } from "../../../models/role";
import { accessSystem } from "../../access";
import { floorSystem } from "../../floors";
import { floorState } from "../../floors/state";
import { gameState } from "../../game/state";
import { playerSystem } from "../../players";
import { playerState } from "../../players/state";
import { getProperties } from "../../properties/state";
import { locationSettingsState } from "../../settings/location/state";
import { Access } from "../models";

const toast = useToast();

export function getTpZoneShapes(fromZone: LocalId): LocalId[] {
    const tokenLayer = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Tokens)!;
    const shapes: LocalId[] = [];
    const fromShape = getShape(fromZone);
    if (fromShape === undefined) return [];

    for (const shape of tokenLayer.getShapes({ includeComposites: true, onlyInView: false })) {
        if (
            shape.id !== fromZone &&
            !getProperties(shape.id)!.isLocked &&
            accessSystem.hasAccessTo(shape.id, false, { movement: true }) &&
            fromShape.contains(shape.center)
        ) {
            shapes.push(shape.id);
        }
    }
    return shapes;
}

export async function validateTeleport(
    access: Access,
    tp: LocalId,
    toZone: GlobalId,
    shapesToMove: LocalId[],
): Promise<void> {
    if (gameState.raw.isDm) {
        await teleport(tp, toZone, shapesToMove);
    } else {
        if (access === Access.Disabled) {
            toast.error("You don't have permission to use this TP zone.");
            return;
        } else if (access === Access.Request) {
            toast.info("Request to use teleport zone sent", {
                position: POSITION.TOP_RIGHT,
            });
        }

        const gId = getGlobalId(tp);
        if (gId) {
            sendRequest({
                fromZone: gId,
                toZone,
                transfers: shapesToMove.map((s) => getGlobalId(s)!),
                logic: "tp",
            });
        } else {
            toast.error("Something went wrong while using this tp zone :(");
        }
    }
}

export async function teleport(fromZone: LocalId, toZone: GlobalId, transfers?: readonly LocalId[]): Promise<void> {
    if (!gameState.isDmOrFake.value) {
        console.error("Attempted TP as non-DM");
        return;
    }

    const shapes = transfers ? transfers : getTpZoneShapes(fromZone);
    if (shapes.length === 0) return;

    const activeLocation = locationSettingsState.raw.activeLocation;
    let targetLocation = activeLocation;
    const tpTargetId = getLocalId(toZone);
    const targetShape = tpTargetId === undefined ? undefined : getShape(tpTargetId);
    let center = targetShape?.center;
    let floor = targetShape?.floor?.name;

    if (targetShape === undefined) {
        const shapeInfo = await requestShapeInfo(toZone);
        targetLocation = shapeInfo.location;
        center = toGP(toArrayP(shapeInfo.position));
        floor = shapeInfo.floor;
    }
    if (floor === undefined || center === undefined) return;

    const target = {
        location: targetLocation,
        floor,
        x: center.x,
        y: center.y,
    };

    sendShapesMove({
        shapes: shapes.map((s) => getGlobalId(s)!),
        target,
    });
    const { location, ...position } = target;
    if (locationSettingsState.raw.movePlayerOnTokenChange.value) {
        const players = new Set<string>();
        for (const player of playerState.raw.players.values()) {
            if (player.role === Role.DM) players.add(player.name);
        }
        for (const sh of shapes) {
            for (const owner of accessSystem.getOwners(sh)) players.add(owner);
        }

        if (location === activeLocation) {
            sendSetPlayersPosition({ ...position, players: [...players] });
        } else {
            playerSystem.updatePlayersLocation([...players], location, true, position);
        }
    }
}

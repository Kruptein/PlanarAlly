import type { GlobalPoint } from "../../../../core/geometry";
import { requestShapeInfo, sendShapesMove } from "../../../api/emits/shape/core";
import { getShape, getLocalId, getGlobalId } from "../../../id";
import type { LocalId, GlobalId } from "../../../id";
import { LayerName } from "../../../models/floor";
import { setCenterPosition } from "../../../position";
import { createSimpleShapeFromDict } from "../../../shapes/simple";
import { accessSystem } from "../../access";
import { floorSystem } from "../../floors";
import { floorState } from "../../floors/state";
import { playerSystem } from "../../players";
import { getProperties } from "../../properties/state";
import { locationSettingsState } from "../../settings/location/state";

export function getTpZoneShapes(fromZone: LocalId): LocalId[] {
    const tokenLayer = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Tokens)!;
    const shapes: LocalId[] = [];
    const fromShape = getShape(fromZone);
    if (fromShape === undefined) return [];

    for (const shape of tokenLayer.getShapes({ includeComposites: true })) {
        if (
            !getProperties(shape.id)!.isLocked &&
            accessSystem.hasAccessTo(shape.id, false, { movement: true }) &&
            fromShape.contains(shape.center())
        ) {
            shapes.push(shape.id);
        }
    }
    return shapes;
}

export async function teleport(fromZone: LocalId, toZone: GlobalId, transfers?: readonly LocalId[]): Promise<void> {
    const shapes = transfers ? transfers : getTpZoneShapes(fromZone);
    if (shapes.length === 0) return;

    const activeLocation = locationSettingsState.raw.activeLocation;
    let targetLocation = activeLocation;
    const tpTargetId = getLocalId(toZone);
    const targetShape = tpTargetId === undefined ? undefined : getShape(tpTargetId);
    let center: GlobalPoint | undefined = targetShape?.center();
    let floor: string | undefined = targetShape?.floor.name;

    if (targetShape === undefined) {
        const { location, shape } = await requestShapeInfo(toZone);
        targetLocation = location;
        const simpleShape = createSimpleShapeFromDict(shape);
        if (simpleShape === undefined) return;
        center = simpleShape.center();
        floor = shape.floor;
    }
    if (floor === undefined || center === undefined) return;

    const target = {
        location: targetLocation,
        floor,
        x: center.x,
        y: center.y,
    };

    sendShapesMove({
        shapes: shapes.map((s) => getGlobalId(s)),
        target,
        tp_zone: true,
    });
    const { location, ...position } = target;
    if (locationSettingsState.raw.movePlayerOnTokenChange.value) {
        if (location === activeLocation) {
            setCenterPosition(center);
        } else {
            const users: Set<string> = new Set();
            for (const sh of shapes) {
                for (const owner of accessSystem.getOwners(sh)) users.add(owner);
            }
            playerSystem.updatePlayersLocation([...users], location, true, position);
        }
    }
}

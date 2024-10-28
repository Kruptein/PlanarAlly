import type { ApiCoreShape, ApiShape } from "../../apiTypes";
import { getGlobalId } from "../id";
import type { IShape } from "../interfaces/shape";
import type { ServerShapeOptions } from "../models/shapes";
import { accessSystem } from "../systems/access";
import { ownerToClient, ownerToServer } from "../systems/access/helpers";
import { auraSystem } from "../systems/auras";
import { aurasFromServer, aurasToServer } from "../systems/auras/conversion";
import { characterSystem } from "../systems/characters";
import { groupSystem } from "../systems/groups";
import { doorSystem } from "../systems/logic/door";
import { teleportZoneSystem } from "../systems/logic/tp";
import { noteSystem } from "../systems/notes";
import { propertiesSystem } from "../systems/properties";
import { getProperties } from "../systems/properties/state";
import { trackerSystem } from "../systems/trackers";
import { trackersFromServer, trackersToServer } from "../systems/trackers/conversion";

export function loadShapeData(shape: IShape, data: ApiShape): void {
    const options: Partial<ServerShapeOptions> =
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        Object.fromEntries(JSON.parse(data.options));

    shape.fromDict(data, options);

    const id = shape.id;

    propertiesSystem.inform(id, {
        name: data.name,
        nameVisible: data.name_visible,
        blocksMovement: data.movement_obstruction,
        blocksVision: data.vision_obstruction,
        fillColour: data.fill_colour,
        strokeColour: [data.stroke_colour],
        isToken: data.is_token,
        isInvisible: data.is_invisible,
        isDefeated: data.is_defeated,
        showBadge: data.show_badge,
        isLocked: data.is_locked,
        oddHexOrientation: data.odd_hex_orientation,
        size: data.size,
        showCells: data.show_cells,
        ...(data.cell_fill_colour !== null ? { cellFillColour: data.cell_fill_colour } : {}),
        ...(data.cell_stroke_colour !== null ? { cellStrokeColour: data.cell_stroke_colour } : {}),
        ...(data.cell_stroke_width !== null ? { cellStrokeWidth: data.cell_stroke_width } : {}),
    });

    const defaultAccess = {
        edit: data.default_edit_access,
        vision: data.default_vision_access,
        movement: data.default_movement_access,
    };
    accessSystem.inform(id, {
        default: defaultAccess,
        extra: data.owners.map((owner) => ownerToClient(owner)),
    });
    auraSystem.inform(id, aurasFromServer(...data.auras));
    trackerSystem.inform(id, trackersFromServer(...data.trackers));
    doorSystem.inform(id, data.is_door, options.door);
    teleportZoneSystem.inform(id, data.is_teleport_zone, options.teleport);
    if (data.character !== null) characterSystem.inform(id, data.character);
    noteSystem.inform(id);
    groupSystem.inform(id, { groupId: data.group ?? undefined, badge: data.badge });
}

export function exportShapeData(shape: IShape): ApiCoreShape {
    const defaultAccess = accessSystem.getDefault(shape.id);
    const props = getProperties(shape.id)!;
    const uuid = getGlobalId(shape.id)!;

    return {
        type_: shape.type,
        uuid,
        x: shape.refPoint.x,
        y: shape.refPoint.y,
        angle: shape.angle,
        draw_operator: shape.globalCompositeOperation,
        movement_obstruction: props.blocksMovement,
        vision_obstruction: props.blocksVision,
        auras: aurasToServer(uuid, auraSystem.getAll(shape.id, false)),
        trackers: trackersToServer(uuid, trackerSystem.getAll(shape.id, false)),
        owners: accessSystem.getOwnersFull(shape.id).map((o) => ownerToServer(o)),
        fill_colour: props.fillColour,
        stroke_colour: props.strokeColour[0]!,
        stroke_width: shape.strokeWidth,
        name: props.name,
        name_visible: props.nameVisible,
        is_token: props.isToken,
        is_invisible: props.isInvisible,
        is_defeated: props.isDefeated,
        options: JSON.stringify(Object.entries(shape.options)),
        badge: groupSystem.getBadge(shape.id),
        show_badge: props.showBadge,
        is_locked: props.isLocked,
        default_edit_access: defaultAccess.edit,
        default_movement_access: defaultAccess.movement,
        default_vision_access: defaultAccess.vision,
        asset: shape.assetId ?? null,
        group: groupSystem.getGroupId(shape.id) ?? null,
        ignore_zoom_size: shape.ignoreZoomSize,
        is_door: doorSystem.isDoor(shape.id),
        is_teleport_zone: teleportZoneSystem.isTeleportZone(shape.id),
        character: shape.character ?? null,
        odd_hex_orientation: props.oddHexOrientation,
        size: props.size,
        show_cells: props.showCells,
        cell_fill_colour: props.cellFillColour ?? null,
        cell_stroke_colour: props.cellStrokeColour ?? null,
        cell_stroke_width: props.cellStrokeWidth ?? null,
    };
}

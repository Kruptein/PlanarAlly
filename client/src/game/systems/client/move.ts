import { toGP } from "../../../core/geometry";
import { InvalidationMode, SyncMode } from "../../../core/models/types";
import { uuidv4 } from "../../../core/utils";
import { getShape } from "../../id";
import { LayerName } from "../../models/floor";
import type { ServerUserLocationOptions } from "../../models/settings";
import { Polygon } from "../../shapes/variants/polygon";
import { floorSystem } from "../floors";
import { floorState } from "../floors/state";
import { playerState } from "../players/state";

import { clientState } from "./state";

export function moveClientRect(player: number, data: ServerUserLocationOptions): void {
    clientState._$.playerLocationData.set(player, data);

    const id = clientState._$.playerRectIds.get(player);
    const layer = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Dm)!;

    let polygon: Polygon | undefined = id ? (getShape(id) as Polygon) : undefined;
    if (polygon === undefined) {
        polygon = new Polygon(
            toGP(0, 0),
            undefined,
            {
                lineWidth: [30, 15],
                openPolygon: true,
                uuid: uuidv4(),
                isSnappable: false,
            },
            { fillColour: "rgba(0, 0, 0, 0)", strokeColour: ["rgba(0, 0, 0, 1)", "rgba(255, 255, 255, 1)"] },
        );
        clientState._$.playerRectIds.set(player, polygon.id);
        polygon.options.isPlayerRect = true;
        polygon.options.skipDraw = !(playerState.$.players.find((p) => p.id === player)?.showRect ?? false);
        polygon.preventSync = true;
        layer.addShape(polygon, SyncMode.NO_SYNC, InvalidationMode.NO);
    }
    const h = data.client_h / data.zoom_factor;
    const w = data.client_w / data.zoom_factor;
    polygon.vertices = [toGP(0, 0), toGP(0, h), toGP(w, h), toGP(w, 0), toGP(0, 0)];
    polygon.center(toGP(w / 2 - data.pan_x, h / 2 - data.pan_y));
    layer.invalidate(true);
}

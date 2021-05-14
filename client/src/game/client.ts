import { toGP } from "../core/geometry";
import { InvalidationMode, SyncMode } from "../core/models/types";
import { uuidv4 } from "../core/utils";
import { floorStore } from "../store/floor";
import { UuidMap } from "../store/shapeMap";

import { sendMoveClient } from "./api/emits/client";
import { LayerName } from "./models/floor";
import { ServerUserLocationOptions } from "./models/settings";
import { Rect } from "./shapes/variants/rect";

const playerRectUuids: Map<number, string> = new Map();
const playerLocationData: Map<number, ServerUserLocationOptions> = new Map();

export function moveClientRect(player: number, data: ServerUserLocationOptions): void {
    if (!playerRectUuids.has(player)) {
        playerRectUuids.set(player, uuidv4());
    }
    playerLocationData.set(player, data);
    const uuid = playerRectUuids.get(player)!;
    const layer = floorStore.getLayer(floorStore.currentFloor.value!, LayerName.Dm)!;
    if (!UuidMap.has(uuid)) {
        const rect = new Rect(toGP(0, 0), 100, 100, {
            fillColour: "rgba(0, 0, 0, 0)",
            strokeColour: "rgba(0, 0, 0, 1)",
            uuid,
        });
        rect.options.isPlayerRect = true;
        rect.preventSync = true;
        layer.addShape(rect, SyncMode.NO_SYNC, InvalidationMode.NO, false);
    }
    const rect = UuidMap.get(uuid)! as Rect;
    const h = data.client_h / data.zoom_factor;
    const w = data.client_w / data.zoom_factor;
    rect.h = h;
    rect.w = w;
    rect.center(toGP(w / 2 - data.pan_x, h / 2 - data.pan_y));
    layer.invalidate(true);
}

export function moveClient(rectUuid: string): void {
    const player = [...playerRectUuids.entries()].find(([_, uuid]) => uuid === rectUuid)?.[0] ?? -1;
    if (player < 0) return;
    const rect = UuidMap.get(rectUuid)!;
    if (rect === undefined) return;
    const playerData = playerLocationData.get(player);
    if (playerData === undefined) return;

    const h = playerData.client_h / playerData.zoom_factor;
    const w = playerData.client_w / playerData.zoom_factor;

    const center = rect.center();

    sendMoveClient({ player, data: { ...playerData, pan_x: w / 2 - center.x, pan_y: h / 2 - center.y } });
}

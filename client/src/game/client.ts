import { throttle } from "lodash";

import { toGP } from "../core/geometry";
import { InvalidationMode, SyncMode } from "../core/models/types";
import { uuidv4 } from "../core/utils";
import { floorStore } from "../store/floor";
import { gameStore } from "../store/game";

import { sendMoveClient } from "./api/emits/client";
import { getShape } from "./id";
import type { LocalId } from "./id";
import { LayerName } from "./models/floor";
import type { ServerUserLocationOptions } from "./models/settings";
import { Polygon } from "./shapes/variants/polygon";

const playerRectIds: Map<number, LocalId> = new Map();
const playerLocationData: Map<number, ServerUserLocationOptions> = new Map();

const sendMoveClientThrottled = throttle(sendMoveClient, 50, { trailing: true });

export function clearClientRects(): void {
    for (const id of playerRectIds.values()) {
        const p = getShape(id)!;
        p.layer.removeShape(p, { sync: SyncMode.NO_SYNC, recalculate: false, dropShapeId: true });
    }
    playerRectIds.clear();
    playerLocationData.clear();
}

export function moveClientRect(player: number, data: ServerUserLocationOptions): void {
    playerLocationData.set(player, data);

    const id = playerRectIds.get(player);
    const layer = floorStore.getLayer(floorStore.currentFloor.value!, LayerName.Dm)!;

    let polygon: Polygon | undefined = id ? (getShape(id) as Polygon) : undefined;
    if (polygon === undefined) {
        polygon = new Polygon(toGP(0, 0), undefined, {
            fillColour: "rgba(0, 0, 0, 0)",
            strokeColour: ["rgba(0, 0, 0, 1)", "rgba(255, 255, 255, 1)"],
            lineWidth: [30, 15],
            openPolygon: true,
            uuid: uuidv4(),
            isSnappable: false,
        });
        playerRectIds.set(player, polygon.id);
        polygon.options.isPlayerRect = true;
        polygon.options.skipDraw = !(gameStore.state.players.find((p) => p.id === player)?.showRect ?? false);
        polygon.preventSync = true;
        layer.addShape(polygon, SyncMode.NO_SYNC, InvalidationMode.NO);
    }
    const h = data.client_h / data.zoom_factor;
    const w = data.client_w / data.zoom_factor;
    polygon.vertices = [toGP(0, 0), toGP(0, h), toGP(w, h), toGP(w, 0), toGP(0, 0)];
    polygon.center(toGP(w / 2 - data.pan_x, h / 2 - data.pan_y));
    layer.invalidate(true);
}

export function moveClient(rectUuid: LocalId): void {
    const player = [...playerRectIds.entries()].find(([_, uuid]) => uuid === rectUuid)?.[0] ?? -1;
    if (player < 0) return;
    const rect = getShape(rectUuid)!;
    if (rect === undefined) return;
    const playerData = playerLocationData.get(player);
    if (playerData === undefined) return;

    const h = playerData.client_h / playerData.zoom_factor;
    const w = playerData.client_w / playerData.zoom_factor;

    const center = rect.center();

    sendMoveClientThrottled({ player, data: { ...playerData, pan_x: w / 2 - center.x, pan_y: h / 2 - center.y } });
}

export function showClientRect(player: number, show: boolean): void {
    const rectUuid = playerRectIds.get(player);
    if (rectUuid === undefined) return;
    const rect = getShape(rectUuid)!;
    if (rect === undefined) return;

    rect.options.skipDraw = !show;
    rect.layer.invalidate(true);
}

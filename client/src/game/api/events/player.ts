import { toGP } from "../../../core/geometry";
import { InvalidationMode, SyncMode } from "../../../core/models/types";
import { uuidv4 } from "../../../core/utils";
import { floorStore } from "../../../store/floor";
import { gameStore } from "../../../store/game";
import { UuidMap } from "../../../store/shapeMap";
import { LayerName } from "../../models/floor";
import { ServerUserLocationOptions } from "../../models/settings";
import { Rect } from "../../shapes/variants/rect";
import { socket } from "../socket";

const playerRectUuids: Map<number, string> = new Map();

socket.on("Player.Role.Set", (data: { player: number; role: number }) => {
    gameStore.setPlayerRole(data.player, data.role, false);
});

socket.on("Player.Move", (data: { player: number } & ServerUserLocationOptions) => {
    if (!playerRectUuids.has(data.player)) {
        playerRectUuids.set(data.player, uuidv4());
    }
    const uuid = playerRectUuids.get(data.player)!;
    const layer = floorStore.getLayer(floorStore.currentFloor.value!, LayerName.Draw)!;
    if (!UuidMap.has(uuid)) {
        const rect = new Rect(toGP(0, 0), 100, 100, {
            fillColour: "rgba(0, 0, 0, 0)",
            strokeColour: "rgba(0, 0, 0, 1)",
            uuid,
        });
        layer.addShape(rect, SyncMode.NO_SYNC, InvalidationMode.NO, false);
    }
    const rect = UuidMap.get(uuid)! as Rect;
    const h = data.client_h / data.zoom_factor;
    const w = data.client_w / data.zoom_factor;
    rect.h = h;
    rect.w = w;
    rect.center(toGP(w / 2 - data.pan_x, h / 2 - data.pan_y));
    layer.invalidate(true);
});

import { throttle } from "lodash";

import { registerSystem } from "..";
import type { System } from "..";
import { sendMoveClient } from "../../api/emits/client";
import { getShape } from "../../id";
import type { LocalId } from "../../id";

import { clientState } from "./state";

const { _$ } = clientState;

const sendMoveClientThrottled = throttle(sendMoveClient, 50, { trailing: true });

class ClientSystem implements System {
    clear(): void {
        this.clearClientRects();
    }

    clearClientRects(): void {
        _$.playerRectIds.clear();
        _$.playerLocationData.clear();
    }

    moveClient(rectUuid: LocalId): void {
        const player = [..._$.playerRectIds.entries()].find(([_, uuid]) => uuid === rectUuid)?.[0] ?? -1;
        if (player < 0) return;
        const rect = getShape(rectUuid)!;
        if (rect === undefined) return;
        const playerData = _$.playerLocationData.get(player);
        if (playerData === undefined) return;

        const h = playerData.client_h / playerData.zoom_factor;
        const w = playerData.client_w / playerData.zoom_factor;

        const center = rect.center();

        sendMoveClientThrottled({ player, data: { ...playerData, pan_x: w / 2 - center.x, pan_y: h / 2 - center.y } });
    }

    showClientRect(player: number, show: boolean): void {
        const rectUuid = _$.playerRectIds.get(player);
        if (rectUuid === undefined) return;
        const rect = getShape(rectUuid)!;
        if (rect === undefined) return;

        rect.options.skipDraw = !show;
        rect.layer.invalidate(true);
    }
}

export const clientSystem = new ClientSystem();
registerSystem("client", clientSystem, false);

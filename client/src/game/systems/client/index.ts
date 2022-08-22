import { throttle } from "lodash";

import type { System } from "..";
import { registerSystem } from "..";
import { zoomDisplayToFactor } from "../../../core/conversions";
import { toGP } from "../../../core/geometry";
import type { GlobalPoint } from "../../../core/geometry";
import { InvalidationMode, SyncMode } from "../../../core/models/types";
import { settingsStore } from "../../../store/settings";
import { sendMoveClient } from "../../api/emits/client";
import type { LocalId } from "../../id";
import { getShape } from "../../id";
import { LayerName } from "../../models/floor";
import type { ServerUserLocationOptions } from "../../models/settings";
import { Polygon } from "../../shapes/variants/polygon";
import { floorSystem } from "../floors";
import { floorState } from "../floors/state";
import { playerSystem } from "../players";
import type { PlayerId } from "../players/models";
import { playerState } from "../players/state";

import type { ClientId, Viewport } from "./models";
import { clientState } from "./state";

const { mutableReactive: $ } = clientState;

const sendMoveClientThrottled = throttle(sendMoveClient, 50, { trailing: true });

class ClientSystem implements System {
    clear(): void {
        $.clientIds.clear();
        $.clientRectIds.clear();
        $.clientViewports.clear();
    }

    addClient(player: PlayerId, client: ClientId): void {
        $.clientIds.set(client, player);
    }

    removeClient(client: ClientId): void {
        $.clientIds.delete(client);
        this.removeClientRect(client);
    }

    getClients(player: PlayerId): ClientId[] {
        return [...$.clientIds.entries()].filter(([, p]) => p === player).map(([c, _]) => c);
    }

    updatePlayerRect(player: PlayerId): void {
        for (const [c, p] of $.clientIds.entries()) {
            if (player === p) this.updateClientRect(c);
        }
    }

    updateAllClientRects(): void {
        for (const client of $.clientIds.keys()) {
            this.updateClientRect(client);
        }
    }

    private updateClientRect(client: ClientId): void {
        const shapeId = $.clientRectIds.get(client);
        const playerId = $.clientIds.get(client);
        if (playerId === undefined) return;

        if (playerState.mutableReactive.players.get(playerId)?.location === settingsStore.state.activeLocation) {
            if (shapeId === undefined) {
                this.createClientRect(client);
            } else {
                const shape = getShape(shapeId) as Polygon;
                if (shape === undefined) return;
                const locationData = this.getClientPosition(client);
                const viewport = $.clientViewports.get(client);
                if (locationData === undefined || viewport === undefined) return;
                this.moveClientRect(shape, locationData, viewport);
            }
        } else if (shapeId !== undefined) {
            this.removeClientRect(client);
        }
    }

    private removeClientRect(client: ClientId): void {
        const rect = $.clientRectIds.get(client);
        if (rect !== undefined) {
            const shape = getShape(rect);
            if (shape !== undefined) {
                shape.layer.removeShape(shape, { sync: SyncMode.NO_SYNC, recalculate: false, dropShapeId: true });
            }
            $.clientRectIds.delete(client);
        }
    }

    private moveClientRect(polygon: Polygon, position: ServerUserLocationOptions, viewport: Viewport): void {
        const factor = zoomDisplayToFactor(position.zoom_display);
        const h = viewport.height / factor;
        const w = viewport.width / factor;
        polygon.vertices = [toGP(0, 0), toGP(0, h), toGP(w, h), toGP(w, 0), toGP(0, 0)];
        polygon.center(toGP(w / 2 - position.pan_x, h / 2 - position.pan_y));
        polygon.invalidate(true);
    }

    private getClientPosition(client: ClientId): ServerUserLocationOptions | undefined {
        const player = $.clientIds.get(client);
        if (player === undefined) return undefined;
        return playerSystem.getPosition(player);
    }

    private createClientRect(client: ClientId): void {
        const locationData = this.getClientPosition(client);
        const viewport = $.clientViewports.get(client);
        if (locationData === undefined || viewport === undefined) {
            console.error("Could not create new client rect: missing data.");
            return;
        }
        if ($.clientRectIds.has(client)) {
            console.error("Could not create new client rect: already exists.");
            return;
        }
        const playerId = $.clientIds.get(client);
        if (playerId === undefined) {
            console.error("Could not find player for client");
            return;
        }

        const polygon = new Polygon(
            toGP(0, 0),
            undefined,
            {
                lineWidth: [30, 15],
                openPolygon: true,
                isSnappable: false,
            },
            { fillColour: "rgba(0, 0, 0, 0)", strokeColour: ["rgba(0, 0, 0, 1)", "rgba(255, 255, 255, 1)"] },
        );
        $.clientRectIds.set(client, polygon.id);
        polygon.options.isPlayerRect = true;
        polygon.options.skipDraw = !(playerSystem.getPlayer(playerId)?.showRect ?? false);
        polygon.preventSync = true;

        const layer = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Dm)!;
        layer.addShape(polygon, SyncMode.NO_SYNC, InvalidationMode.NO);

        this.moveClientRect(polygon, locationData, viewport);
    }

    setClientViewport(client: ClientId, viewport: Viewport): void {
        $.clientViewports.set(client, viewport);
        this.updateClientRect(client);
    }

    moveClient(rectUuid: LocalId): void {
        const client = [...$.clientRectIds.entries()].find(([_, uuid]) => uuid === rectUuid)?.[0];
        if (client === undefined) return;

        const rect = getShape(rectUuid)!;
        if (rect === undefined) return;
        const locationData = this.getClientPosition(client);
        const viewport = $.clientViewports.get(client);
        if (locationData === undefined || viewport === undefined) return;

        const factor = zoomDisplayToFactor(locationData.zoom_display);
        const h = viewport.height / factor;
        const w = viewport.width / factor;

        const center = rect.center();
        const newPosition = { ...locationData, pan_x: w / 2 - center.x, pan_y: h / 2 - center.y };

        sendMoveClientThrottled({
            client,
            data: newPosition,
        });
        const player = $.clientIds.get(client);
        if (player !== undefined) {
            playerSystem.setPosition(player, newPosition);
        }
    }

    showClientRect(client: ClientId, show: boolean): void {
        const rectUuid = $.clientRectIds.get(client);
        if (rectUuid === undefined) return;
        const rect = getShape(rectUuid);
        if (rect === undefined) return;

        rect.options.skipDraw = !show;
        rect.layer.invalidate(true);
    }

    getClientLocation(client: ClientId): GlobalPoint | undefined {
        const locationData = this.getClientPosition(client);
        const viewport = $.clientViewports.get(client);
        if (locationData === undefined || viewport === undefined) return;

        const factor = zoomDisplayToFactor(locationData.zoom_display);
        const h = viewport.height / factor;
        const w = viewport.width / factor;
        return toGP(w / 2 - locationData.pan_x, h / 2 - locationData.pan_y);
    }
}

export const clientSystem = new ClientSystem();
registerSystem("client", clientSystem, false);

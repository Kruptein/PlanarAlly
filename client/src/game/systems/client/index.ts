import throttle from "lodash/throttle";

import type { ClientPosition, Viewport } from "../../../apiTypes";
import { toGP } from "../../../core/geometry";
import type { GlobalPoint } from "../../../core/geometry";
import type { LocalId } from "../../../core/id";
import { filter, map } from "../../../core/iter";
import { InvalidationMode, SyncMode } from "../../../core/models/types";
import { registerSystem } from "../../../core/systems";
import type { System } from "../../../core/systems";
import { setLocalStorageObject } from "../../../localStorageHelpers";
import { sendMoveClient, sendOffset, sendViewport } from "../../api/emits/client";
import { getClientId } from "../../api/socket";
import { getShape } from "../../id";
import { LayerName } from "../../models/floor";
import { Polygon } from "../../shapes/variants/polygon";
import { floorSystem } from "../floors";
import { floorState } from "../floors/state";
import { playerSystem } from "../players";
import type { PlayerId } from "../players/models";
import { playerState } from "../players/state";
import { positionSystem } from "../position";
import { positionState } from "../position/state";
import { locationSettingsState } from "../settings/location/state";

import type { ClientId } from "./models";
import { clientState } from "./state";

const { mutableReactive: $, raw } = clientState;

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
        $.clientViewports.delete(client);
    }

    getClients(player: PlayerId): Iterable<ClientId> {
        const filtered = filter($.clientIds.entries(), ([, p]) => p === player);
        return map(filtered, ([c, _]) => c);
    }

    getPlayer(client: ClientId): PlayerId | undefined {
        for (const [_client, player] of raw.clientIds.entries()) {
            if (client === _client) return player;
        }
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

        if (playerState.raw.players.get(playerId)?.location === locationSettingsState.raw.activeLocation) {
            let shape: Polygon;
            if (shapeId === undefined) {
                shape = this.createClientRect(client)!;
                if (shape === undefined) return;
            } else {
                shape = getShape(shapeId) as Polygon;
                if (shape === undefined) return;
                this.moveClientRect(client, shape);
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
                shape.layer?.removeShape(shape, { sync: SyncMode.NO_SYNC, recalculate: false, dropShapeId: true });
            }
            $.clientRectIds.delete(client);
        }
    }

    private moveClientRect(client: ClientId, polygon: Polygon): void {
        const dimensions = this.getDimensions(client);
        if (dimensions === undefined) return;
        const { center, h, w } = dimensions;
        polygon.vertices = [toGP(0, 0), toGP(0, h), toGP(w, h), toGP(w, 0), toGP(0, 0)];
        polygon.center = center;
        polygon.invalidate(true);
    }

    private getClientPosition(client: ClientId): ClientPosition | undefined {
        const player = $.clientIds.get(client);
        if (player === undefined) return undefined;
        return playerSystem.getPosition(player);
    }

    private createClientRect(client: ClientId): Polygon | undefined {
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

        this.moveClientRect(client, polygon);

        return polygon;
    }

    setClientViewport(client: ClientId, viewport: Viewport, update: boolean): void {
        $.clientViewports.set(client, viewport);
        if (update) this.updateClientRect(client);
    }

    moveClient(rectUuid: LocalId): void {
        const client = [...$.clientRectIds.entries()].find(([_, uuid]) => uuid === rectUuid)?.[0];
        if (client === undefined) return;

        const rect = getShape(rectUuid)!;
        if (rect === undefined) return;
        const locationData = this.getClientPosition(client);
        const viewport = $.clientViewports.get(client);
        const offset = this.getOffset(client);
        if (locationData === undefined || viewport === undefined || offset === undefined) return;

        const dimensions = this.getDimensions(client);
        if (dimensions === undefined) return;
        const { h, w } = dimensions;

        const center = rect.center;
        const newPosition = { ...locationData, pan_x: w / 2 - center.x - offset.x, pan_y: h / 2 - center.y - offset.y };

        sendMoveClientThrottled({
            client,
            position: newPosition,
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
        rect.layer?.invalidate(true);
    }

    getClientLocation(client: ClientId): GlobalPoint | undefined {
        return this.getDimensions(client)?.center;
    }

    private getDimensions(client: ClientId): { w: number; h: number; center: GlobalPoint } | undefined {
        const viewport = $.clientViewports.get(client);
        const offset = this.getOffset(client);
        const locationData = this.getClientPosition(client);
        const player = $.clientIds.get(client);
        if (viewport === undefined || locationData === undefined || offset === undefined || player === undefined) {
            return undefined;
        }

        if (playerSystem.getCurrentPlayer()?.location !== playerSystem.getPlayer(player)?.location) {
            return undefined;
        }

        const factor = viewport.zoom_factor;
        const h = viewport.height / factor;
        const w = viewport.width / factor;
        return { w, h, center: toGP(w / 2 - locationData.pan_x - offset.x, h / 2 - locationData.pan_y - offset.y) };
    }

    initViewport(): void {
        const client = getClientId();
        $.clientViewports.set(client, {
            height: window.innerHeight,
            width: window.innerWidth,
            zoom_factor: positionState.readonly.zoom,
        });
    }

    getViewport(client?: ClientId): Viewport | undefined {
        return $.clientViewports.get(client ?? getClientId());
    }

    sendViewportInfo(): void {
        if (Number.isNaN(positionState.readonly.zoom)) return;
        const viewport = this.getViewport()!;
        sendViewport(viewport);
    }

    updateZoomFactor(): void {
        const viewport = $.clientViewports.get(getClientId());
        if (viewport === undefined) {
            console.error("Setting offset without viewport");
            return;
        }

        viewport.zoom_factor = positionState.readonly.zoom;
        this.sendViewportInfo();
    }

    // Offset

    private getRelativeOffset(): { x: number; y: number } {
        const viewport = this.getViewport()!;
        return {
            x: viewport.offset_x ?? 0,
            y: viewport.offset_y ?? 0,
        };
    }

    getOffset(client?: ClientId): { x: number; y: number } {
        const viewport = this.getViewport(client ?? getClientId());
        if (viewport === undefined) return { x: 0, y: 0 };
        return {
            x: (-viewport.width / viewport.zoom_factor) * (viewport.offset_x ?? 0),
            y: (-viewport.height / viewport.zoom_factor) * (viewport.offset_y ?? 0),
        };
    }

    setOffset(client: ClientId, offset: { x?: number; y?: number }, sync: boolean): void {
        if (offset.x === undefined && offset.y === undefined) return;
        const viewport = $.clientViewports.get(client);
        if (viewport === undefined) {
            console.error("Setting offset without viewport");
            return;
        }

        if (offset.x !== undefined) viewport.offset_x = offset.x;
        if (offset.y !== undefined) viewport.offset_y = offset.y;

        this.updateClientRect(client);

        if (sync) sendOffset({ client, x: viewport.offset_x, y: viewport.offset_y });
        if (client === getClientId()) {
            positionSystem.setGridOffset(this.getOffset());
            setLocalStorageObject("PA_OFFSET", this.getRelativeOffset());
        }
    }
}

export const clientSystem = new ClientSystem();
registerSystem("client", clientSystem, false, clientState);

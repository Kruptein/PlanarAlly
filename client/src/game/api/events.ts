import { AssetList } from "@/core/comm/types";
import { socket } from "@/game/api/socket";
import { BoardInfo, Note, ServerClient, ServerLocation } from "@/game/comm/types/general";
import { ServerShape } from "@/game/comm/types/shapes";
import { EventBus } from "@/game/event-bus";
import { GlobalPoint } from "@/game/geom";
import { layerManager } from "@/game/layers/manager";
import { createLayer } from "@/game/layers/utils";
import { gameManager } from "@/game/manager";
import { gameStore } from "@/game/store";
import { router } from "@/router";
import { zoomDisplay } from "../utils";
import { visibilityStore } from "../visibility/store";

socket.on("connect", () => {
    console.log("Connected");
});
socket.on("disconnect", () => {
    console.log("Disconnected");
});
socket.on("connect_error", (_error: any) => {
    console.error("Could not connect to game session.");
    router.push("/dashboard");
});
socket.on("error", (_error: any) => {
    console.error("Game session does not exist.");
    router.push("/dashboard");
});
socket.on("redirect", (destination: string) => {
    console.log("redirecting");
    router.push(destination);
});
socket.on(
    "Room.Info.Set",
    (data: {
        name: string;
        creator: string;
        invitationCode: string;
        isLocked: boolean;
        players: { id: number; name: string }[];
    }) => {
        gameStore.setRoomName(data.name);
        gameStore.setRoomCreator(data.creator);
        gameStore.setInvitationCode(data.invitationCode);
        gameStore.setIsLocked({ isLocked: data.isLocked, sync: false });
        gameStore.setPlayers(data.players);
    },
);
socket.on("Room.Info.InvitationCode.Set", (invitationCode: string) => {
    gameStore.setInvitationCode(invitationCode);
    EventBus.$emit("DmSettings.RefreshedInviteCode");
});
socket.on("Room.Info.Players.Add", (data: { id: number; name: string }) => {
    gameStore.addPlayer(data);
});
socket.on("Username.Set", (username: string) => {
    gameStore.setUsername(username);
    gameStore.setDM(username === decodeURIComponent(window.location.pathname.split("/")[2]));
});
socket.on("Client.Options.Set", (options: ServerClient) => {
    gameStore.setGridColour({ colour: options.grid_colour, sync: false });
    gameStore.setFOWColour({ colour: options.fow_colour, sync: false });
    gameStore.setRulerColour({ colour: options.ruler_colour, sync: false });
    gameStore.setPanX(options.pan_x);
    gameStore.setPanY(options.pan_y);
    gameStore.setZoomDisplay(zoomDisplay(options.zoom_factor));
    // gameStore.setZoomDisplay(0.5);
    if (options.active_layer) layerManager.selectLayer(options.active_layer, false);
    if (layerManager.getGridLayer() !== undefined) layerManager.getGridLayer()!.invalidate();
});
socket.on("Location.Set", (data: Partial<ServerLocation>) => {
    if (data.name !== undefined) gameStore.setLocationName(data.name);
    if (data.unit_size !== undefined) gameStore.setUnitSize({ unitSize: data.unit_size, sync: false });
    if (data.use_grid !== undefined) gameStore.setUseGrid({ useGrid: data.use_grid, sync: false });
    if (data.full_fow !== undefined) gameStore.setFullFOW({ fullFOW: data.full_fow, sync: false });
    if (data.fow_opacity !== undefined) gameStore.setFOWOpacity({ fowOpacity: data.fow_opacity, sync: false });
    if (data.fow_los !== undefined) gameStore.setLineOfSight({ fowLOS: data.fow_los, sync: false });
    if (data.vision_min_range !== undefined) gameStore.setVisionRangeMin({ value: data.vision_min_range, sync: false });
    if (data.vision_max_range !== undefined) gameStore.setVisionRangeMax({ value: data.vision_max_range, sync: false });
    if (data.vision_mode !== undefined) {
        visibilityStore.setVisionMode({ mode: data.vision_mode, sync: false });
        visibilityStore.recalculateVision();
        visibilityStore.recalculateMovement();
    }
});
socket.on("Position.Set", (data: { x: number; y: number }) => {
    gameManager.setCenterPosition(new GlobalPoint(data.x, data.y));
});
socket.on("Notes.Set", (notes: Note[]) => {
    for (const note of notes) gameStore.newNote({ note, sync: false });
});
socket.on("Asset.List.Set", (assets: AssetList) => {
    gameStore.setAssets(assets);
});
socket.on("Board.Set", (locationInfo: BoardInfo) => {
    gameStore.clear();
    visibilityStore.clear();
    gameStore.setLocations(locationInfo.locations);
    document.getElementById("layers")!.innerHTML = "";
    gameStore.resetLayerInfo();
    layerManager.reset();
    for (const layer of locationInfo.layers) createLayer(layer);
    // Force the correct opacity render on other layers.
    layerManager.selectLayer(layerManager.getLayer()!.name, false);
    EventBus.$emit("Initiative.Clear");
    visibilityStore.recalculateVision();
    visibilityStore.recalculateMovement();
    gameStore.setBoardInitialized(true);
});
socket.on("Gridsize.Set", (gridSize: number) => {
    gameStore.setGridSize({ gridSize, sync: false });
});
socket.on("Shape.Add", (shape: ServerShape) => {
    gameManager.addShape(shape);
});
socket.on("Shape.Remove", (shape: ServerShape) => {
    if (!layerManager.UUIDMap.has(shape.uuid)) {
        console.log(`Attempted to remove an unknown shape`);
        return;
    }
    if (!layerManager.hasLayer(shape.layer)) {
        console.log(`Attempted to remove shape from an unknown layer ${shape.layer}`);
        return;
    }
    const layer = layerManager.getLayer(shape.layer)!;
    layer.removeShape(layerManager.UUIDMap.get(shape.uuid)!, false);
    layer.invalidate(false);
});
socket.on("Shape.Order.Set", (data: { shape: ServerShape; index: number }) => {
    if (!layerManager.UUIDMap.has(data.shape.uuid)) {
        console.log(`Attempted to move the shape order of an unknown shape`);
        return;
    }
    if (!layerManager.hasLayer(data.shape.layer)) {
        console.log(`Attempted to remove shape from an unknown layer ${data.shape.layer}`);
        return;
    }
    const shape = layerManager.UUIDMap.get(data.shape.uuid)!;
    const layer = layerManager.getLayer(shape.layer)!;
    layer.moveShapeOrder(shape, data.index, false);
});
socket.on("Shape.Layer.Change", (data: { uuid: string; layer: string }) => {
    const shape = layerManager.UUIDMap.get(data.uuid);
    if (shape === undefined) return;
    shape.moveLayer(data.layer, false);
});
socket.on("Shape.Update", (data: { shape: ServerShape; redraw: boolean; move: boolean; temporary: boolean }) => {
    gameManager.updateShape(data);
});
socket.on("Temp.Clear", (shapes: ServerShape[]) => {
    shapes.forEach(shape => {
        if (!layerManager.UUIDMap.has(shape.uuid)) {
            console.log("Attempted to remove an unknown temporary shape");
            return;
        }
        if (!layerManager.hasLayer(shape.layer)) {
            console.log(`Attempted to remove shape from an unknown layer ${shape.layer}`);
            return;
        }
        const realShape = layerManager.UUIDMap.get(shape.uuid)!;
        layerManager.getLayer(shape.layer)!.removeShape(realShape, false);
    });
});
socket.on("Labels.Set", (labels: Label[]) => {
    for (const label of labels) gameStore.addLabel(label);
});
socket.on("Label.Visibility.Set", (data: { user: string; uuid: string; visible: boolean }) => {
    gameStore.setLabelVisibility(data);
});
socket.on("Label.Add", (data: Label) => {
    gameStore.addLabel(data);
});
socket.on("Label.Delete", (data: { user: string; uuid: string }) => {
    gameStore.deleteLabel(data);
});
socket.on("Labels.Filter.Add", (uuid: string) => {
    gameStore.labelFilters.push(uuid);
    layerManager.invalidate();
});
socket.on("Labels.Filter.Remove", (uuid: string) => {
    const idx = gameStore.labelFilters.indexOf(uuid);
    if (idx >= 0) {
        gameStore.labelFilters.splice(idx, 1);
        layerManager.invalidate();
    }
});
socket.on("Labels.Filters.Set", (filters: string[]) => {
    gameStore.setLabelFilters(filters);
});

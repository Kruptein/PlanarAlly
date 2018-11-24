import gameManager from "./manager";
import layerManager from "./layers/manager";

import { AssetList } from "../core/comm/types";
import { GlobalPoint } from "./geom";
import { createLayer } from "./layers/utils";
import game from "./game.vue";
import { BoardInfo, InitiativeData, InitiativeEffect, Note, ServerClient, ServerLocation } from "./comm/types/general";
import { ServerShape } from "./comm/types/shapes";
import socket from "./socket";
import { store } from "./store";
import { getRef } from "../core/utils";


socket.on("connect", () => {
    console.log("Connected");
});
socket.on("disconnect", () => {
    console.log("Disconnected");
});
socket.on("redirect", (destination: string) => {
    console.log("redirecting");
    window.location.href = destination;
});
socket.on("Room.Info.Set", (data: { name: string; creator: string; invitationCode: string }) => {
    store.setRoomName(data.name);
    store.setRoomCreator(data.creator);
    store.setInvitationCode(data.invitationCode);
});
socket.on("Username.Set", (username: string) => {
    store.setUsername(username);
    store.setDM(true);
    // store.commit("setDM", username === window.location.pathname.split("/")[2]);
});
socket.on("Client.Options.Set", (options: ServerClient) => {
    // store.setGridColour", { colour: options.grid_colour, sync: false });
    // store.commit("setFOWColour", { colour: options.fow_colour, sync: false });
    // store.commit("setRulerColour", { colour: options.ruler_colour, sync: false });
    // store.commit("setPanX", options.pan_x);
    // store.commit("setPanY", options.pan_y);
    // store.commit("setZoomFactor", options.zoom_factor);
    if (options.active_layer)
        layerManager.selectLayer(options.active_layer, false);
    if (layerManager.getGridLayer() !== undefined) layerManager.getGridLayer()!.invalidate();
});
socket.on("Location.Set", (data: Partial<ServerLocation>) => {
    // if (data.name !== undefined) store.commit("setLocationName", data.name);
    // if (data.unit_size !== undefined) store.commit("setUnitSize", { unitSize: data.unit_size, sync: false });
    // if (data.use_grid !== undefined) store.commit("setUseGrid", { useGrid: data.use_grid, sync: false });
    // if (data.full_fow !== undefined) store.commit("setFullFOW", { fullFOW: data.full_fow, sync: false });
    // if (data.fow_opacity !== undefined) store.commit("setFOWOpacity", { fowOpacity: data.fow_opacity, sync: false });
    // if (data.fow_los !== undefined) store.commit("setLineOfSight", { fowLOS: data.fow_los, sync: false });
});
socket.on("Position.Set", (data: { x: number; y: number }) => {
    gameManager.setCenterPosition(new GlobalPoint(data.x, data.y));
});
socket.on("Notes.Set", (notes: Note[]) => {
    for (const note of notes) store.newNote(note, false);
});
socket.on("Asset.List.Set", (assets: AssetList) => {
    store.setAssets(assets);
});
socket.on("Board.Set", (locationInfo: BoardInfo) => {
    store.clear();
    store.setLocations(locationInfo.locations);
    document.getElementById("layers")!.innerHTML = "";
    store.resetLayerInfo();
    for (const layer of locationInfo.layers) createLayer(layer);
    // Force the correct opacity render on other layers.
    layerManager.selectLayer(layerManager.getLayer()!.name, false);
    getRef("initiative").clear();
    store.setBoardInitialized(true);
    store.recalculateBV();
});
socket.on("Gridsize.Set", (gridSize: number) => {
    // store.commit("setGridSize", { gridSize, sync: false });
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
socket.on("Shape.Update", (data: { shape: ServerShape; redraw: boolean; move: boolean }) => {
    gameManager.updateShape(data);
});
socket.on("Initiative.Set", (data: InitiativeData[]) => {
    (<any>game).$refs.initiative.data = data.filter(d => !!d);
});
socket.on("Initiative.Turn.Update", (data: string) => {
    (<any>game).$refs.initiative.setTurn(data, false);
});
socket.on("Initiative.Round.Update", (data: number) => {
    (<any>game).$refs.initiative.setRound(data, false);
});
socket.on("Initiative.Effect.New", (data: { actor: string; effect: InitiativeEffect }) => {
    const initiative = (<any>game).$refs.initiative;
    const actor = initiative.getActor(data.actor);
    if (actor === undefined) return;
    initiative.createEffect(actor, data.effect, false);
});
socket.on("Initiative.Effect.Update", (data: { actor: string; effect: InitiativeEffect }) => {
    (<any>game).$refs.initiative.updateEffect(data.actor, data.effect, false);
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

export function sendClientOptions() {
    // socket.emit("Client.Options.Set", {
    //     locationOptions: {
    //         panX: store.state.game.panX,
    //         panY: store.state.game.panY,
    //         zoomFactor: store.state.game.zoomFactor,
    //     },
    // });
}
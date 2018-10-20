import * as io from "socket.io-client";

import gameManager from "../manager";
import store from "../store";

import { AssetList } from "../../core/comm/types";
import { GlobalPoint } from "../geom";
import { createLayer } from "../layers/utils";
import { vm } from "../planarally";
import {
    BoardInfo,
    InitiativeData,
    InitiativeEffect,
    Note,
    ServerClient,
    ServerLocation
} from "./types/general";
import { ServerShape } from "./types/shapes";

export const socket = io.connect(location.protocol + "//" + location.host + "/planarally");
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
    store.commit("setRoomName", data.name);
    store.commit("setRoomCreator", data.creator);
    store.commit("setInvitationCode", data.invitationCode);
});
socket.on("Username.Set", (username: string) => {
    store.commit("setUsername", username);
    store.commit("setDM", username === window.location.pathname.split("/")[2]);
});
socket.on("Client.Options.Set", (options: ServerClient) => {
    store.commit("setGridColour", { colour: options.grid_colour, sync: false });
    store.commit("setFOWColour", { colour: options.fow_colour, sync: false });
    store.commit("setRulerColour", { colour: options.ruler_colour, sync: false });
    store.commit("setPanX", options.pan_x);
    store.commit("setPanY", options.pan_y);
    store.commit("setZoomFactor", options.zoom_factor);
    // if (this.layerManager.getGridLayer() !== undefined) this.layerManager.getGridLayer()!.invalidate();
});
socket.on("Location.Set", (data: ServerLocation) => {
    store.commit("setLocationName", data.name);
    store.commit("setUnitSize", { unitSize: data.unit_size, sync: false });
    store.commit("setUseGrid", { useGrid: data.use_grid, sync: false });
    store.commit("setFullFOW", { fullFOW: data.full_fow, sync: false });
    store.commit("setFOWOpacity", { fowOpacity: data.fow_opacity, sync: false });
    store.commit("setLineOfSight", { fowLOS: data.fow_los, sync: false });
});
socket.on("Position.Set", (data: { x: number; y: number }) => {
    gameManager.setCenterPosition(new GlobalPoint(data.x, data.y));
});
socket.on("Notes.Set", (notes: Note[]) => {
    for (const note of notes) store.commit("newNote", { note, sync: false });
});
socket.on("Asset.List.Set", (assets: AssetList) => {
    store.commit("setAssets", assets);
});
socket.on("Board.Set", (locationInfo: BoardInfo) => {
    gameManager.clear();
    store.commit("setLocations", locationInfo.locations);
    document.getElementById("layers")!.innerHTML = "";
    store.commit("resetLayerInfo");
    for (const layer of locationInfo.layers) createLayer(layer);
    // Force the correct opacity render on other layers.
    gameManager.layerManager.selectLayer(gameManager.layerManager.getLayer()!.name);
    (<any>vm.$refs.initiative).clear();
    store.commit("setBoardInitialized", true);
    gameManager.recalculateBoundingVolume();
});
socket.on("Gridsize.Set", (gridSize: number) => {
    store.commit("setGridSize", { gridSize, sync: false });
});
socket.on("Shape.Add", (shape: ServerShape) => {
    gameManager.addShape(shape);
});
socket.on("Shape.Remove", (shape: ServerShape) => {
    if (!gameManager.layerManager.UUIDMap.has(shape.uuid)) {
        console.log(`Attempted to remove an unknown shape`);
        return;
    }
    if (!gameManager.layerManager.hasLayer(shape.layer)) {
        console.log(`Attempted to remove shape from an unknown layer ${shape.layer}`);
        return;
    }
    const layer = gameManager.layerManager.getLayer(shape.layer)!;
    layer.removeShape(gameManager.layerManager.UUIDMap.get(shape.uuid)!, false);
    layer.invalidate(false);
});
socket.on("Shape.Order.Set", (data: { shape: ServerShape; index: number }) => {
    if (!gameManager.layerManager.UUIDMap.has(data.shape.uuid)) {
        console.log(`Attempted to move the shape order of an unknown shape`);
        return;
    }
    if (!gameManager.layerManager.hasLayer(data.shape.layer)) {
        console.log(`Attempted to remove shape from an unknown layer ${data.shape.layer}`);
        return;
    }
    const shape = gameManager.layerManager.UUIDMap.get(data.shape.uuid)!;
    const layer = gameManager.layerManager.getLayer(shape.layer)!;
    layer.moveShapeOrder(shape, data.index, false);
});
socket.on("Shape.Layer.Change", (data: { uuid: string, layer: string }) => {
    const shape = gameManager.layerManager.UUIDMap.get(data.uuid);
    if (shape === undefined) return;
    shape.moveLayer(data.layer, false);
});
socket.on("Shape.Update", (data: { shape: ServerShape; redraw: boolean, move: boolean }) => {
    gameManager.updateShape(data);
});
socket.on("Initiative.Update", (data: InitiativeData) => {
    const initiative = <any>vm.$refs.initiative;
    if (
        data.initiative === undefined ||
        (!data.owners.includes(store.state.username) && !store.state.IS_DM && !data.visible)
    )
        initiative.removeInitiative(data.uuid, false, true);
    else initiative.updateInitiative(data, false);
});
socket.on("Initiative.Set", (data: InitiativeData[]) => {
    (<any>vm.$refs.initiative).data = data.filter(d => !!d);
});
socket.on("Initiative.Turn.Update", (data: string) => {
    (<any>vm.$refs.initiative).setTurn(data, false);
});
socket.on("Initiative.Round.Update", (data: number) => {
    (<any>vm.$refs.initiative).setRound(data, false);
});
socket.on("Initiative.Effect.New", (data: { actor: string; effect: InitiativeEffect }) => {
    const initiative = <any>vm.$refs.initiative;
    const actor = initiative.getActor(data.actor);
    if (actor === undefined) return;
    initiative.createEffect(actor, data.effect, false);
});
socket.on("Initiative.Effect.Update", (data: { actor: string; effect: InitiativeEffect }) => {
    (<any>vm.$refs.initiative).updateEffect(data.actor, data.effect, false);
});
socket.on("Temp.Clear", (shapes: ServerShape[]) => {
    shapes.forEach(shape => {
        if (!gameManager.layerManager.UUIDMap.has(shape.uuid)) {
            console.log("Attempted to remove an unknown temporary shape");
            return;
        }
        if (!gameManager.layerManager.hasLayer(shape.layer)) {
            console.log(`Attempted to remove shape from an unknown layer ${shape.layer}`);
            return;
        }
        const realShape = gameManager.layerManager.UUIDMap.get(shape.uuid)!;
        gameManager.layerManager.getLayer(shape.layer)!.removeShape(realShape, false);
    });
});

export function sendClientOptions() {
    socket.emit("Client.Options.Set", {
        locationOptions: {
            panX: store.state.panX,
            panY: store.state.panY,
            zoomFactor: store.state.zoomFactor,
        },
    });
}

export default socket;

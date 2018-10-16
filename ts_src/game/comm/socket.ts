import * as io from "socket.io-client";

import gameManager from "../manager";
import store from "../store";

import { AssetList } from "../../core/comm/types";
import { GlobalPoint } from "../geom";
import { createLayer } from "../layers/utils";
import { vm } from "../planarally";
import {
    BoardInfo,
    ClientOptions,
    InitiativeData,
    InitiativeEffect,
    LocationOptions,
    Note
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
socket.on("Client.Options.Set", (options: ClientOptions) => {
    gameManager.setClientOptions(options);
});
socket.on("Location.Options.Set", (options: LocationOptions) => {
    setLocationOptions(options);
});
socket.on("Location.Set", (data: { name: string; options: LocationOptions }) => {
    setLocationOptions(data.options);
    store.commit("setLocationName", data.name);
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
    gameManager.layerManager.setLayer(gameManager.layerManager.getLayer()!.name);
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
socket.on("Shape.Move", (shape: ServerShape) => {
    gameManager.moveShape(shape);
});
socket.on("Shape.Update", (data: { shape: ServerShape; redraw: boolean }) => {
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

function setLocationOptions(options: LocationOptions) {
    if ("unitSize" in options) store.commit("setUnitSize", { unitSize: options.unitSize, sync: false });
    if ("useGrid" in options) store.commit("setUseGrid", { useGrid: options.useGrid, sync: false });
    if ("fullFOW" in options) store.commit("setFullFOW", { fullFOW: options.fullFOW, sync: false });
    if ("fowOpacity" in options) store.commit("setFOWOpacity", { fowOpacity: options.fowOpacity, sync: false });
    if ("fowLOS" in options) store.commit("setLineOfSight", { fowLOS: options.fowLOS, sync: false });
}

export default socket;

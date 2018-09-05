import * as io from "socket.io-client";

import gameManager from "./manager";
import store from "./store";

import {
    AssetList,
    BoardInfo,
    ClientOptions,
    InitiativeData,
    InitiativeEffect,
    LocationOptions,
    Notes,
    ServerShape,
} from "./api_types";
import { GlobalPoint } from "./geom";
import { LayerManager } from "./layers/manager";
import { createLayer } from "./layers/utils";
import { vm } from "./planarally";

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
socket.on("set room info", (data: { name: string; creator: string; invitationCode: string }) => {
    store.commit("setRoomName", data.name);
    store.commit("setRoomCreator", data.creator);
    store.commit("setInvitationCode", data.invitationCode);
});
socket.on("set username", (username: string) => {
    store.commit("setUsername", username);
    store.commit("setDM", username === window.location.pathname.split("/")[2]);
});
socket.on("set clientOptions", (options: ClientOptions) => {
    gameManager.setClientOptions(options);
});
socket.on("set locationOptions", (options: LocationOptions) => {
    setLocationOptions(options);
});
socket.on("set location", (data: { name: string; options: LocationOptions }) => {
    setLocationOptions(data.options);
    store.commit("setLocationName", data.name);
});
socket.on("set position", (data: { x: number; y: number }) => {
    gameManager.setCenterPosition(new GlobalPoint(data.x, data.y));
});
socket.on("set notes", (notes: Notes[]) => {
    for (const n of notes) gameManager.newNote(n.name, n.text, false, false, n.uuid);
});
socket.on("asset list", (assets: AssetList) => {
    store.commit("setAssets", assets);
});
socket.on("board init", (locationInfo: BoardInfo) => {
    store.commit("setLocations", locationInfo.locations);
    gameManager.layerManager = new LayerManager();
    document.getElementById("layers")!.innerHTML = "";
    store.commit("resetLayerInfo");
    for (const layer of locationInfo.board.layers) createLayer(layer);
    // Force the correct opacity render on other layers.
    gameManager.layerManager.setLayer(gameManager.layerManager.getLayer()!.name);
    (<any>vm.$refs.initiative).clear();
});
socket.on("set gridsize", (gridSize: number) => {
    store.commit("setGridSize", { gridSize, sync: false });
});
socket.on("add shape", (shape: ServerShape) => {
    gameManager.addShape(shape);
});
socket.on("remove shape", (shape: ServerShape) => {
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
socket.on("moveShapeOrder", (data: { shape: ServerShape; index: number }) => {
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
socket.on("shapeMove", (shape: ServerShape) => {
    gameManager.moveShape(shape);
});
socket.on("updateShape", (data: { shape: ServerShape; redraw: boolean }) => {
    gameManager.updateShape(data);
});
socket.on("updateInitiative", (data: InitiativeData) => {
    const initiative = <any>vm.$refs.initiative;
    if (
        data.initiative === undefined ||
        (!data.owners.includes(store.state.username) && !store.state.IS_DM && !data.visible)
    )
        initiative.removeInitiative(data.uuid, false, true);
    else initiative.updateInitiative(data, false);
});
socket.on("setInitiative", (data: InitiativeData[]) => {
    (<any>vm.$refs.initiative).data = data;
});
socket.on("updateInitiativeTurn", (data: string) => {
    (<any>vm.$refs.initiative).setTurn(data, false);
});
socket.on("updateInitiativeRound", (data: number) => {
    (<any>vm.$refs.initiative).setRound(data, false);
});
socket.on("Initiative.Effect.New", (data: { actor: string; effect: InitiativeEffect }) => {
    const initiative = <any>vm.$refs.initiative;
    const actor = initiative.getActor(data.actor);
    if (actor === undefined) return;
    initiative.createEffect(actor, data.effect, false);
});
socket.on("Initiative.Effect.Update", (data: { actor: string; effect: InitiativeEffect }) => {
    (<any>vm.$refs.initiative).updateEffect(data.actor, data.effect);
});
socket.on("clear temporaries", (shapes: ServerShape[]) => {
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
    socket.emit("set clientOptions", {
        locationOptions: {
            [`${store.state.roomName}/${store.state.roomCreator}/${store.state.locationName}`]: {
                panX: store.state.panX,
                panY: store.state.panY,
                zoomFactor: store.state.zoomFactor,
            },
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

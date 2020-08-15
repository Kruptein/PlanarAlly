import { InvalidationMode, SyncMode } from "@/core/comm/types";
import { ServerFloor, ServerLayer } from "@/game/comm/types/general";
import { GlobalPoint } from "@/game/geom";
import { FowLightingLayer } from "@/game/layers/fowlighting";
import { FowVisionLayer } from "@/game/layers/fowvision";
import { GridLayer } from "@/game/layers/grid";
import { Layer } from "@/game/layers/layer";
import { layerManager } from "@/game/layers/manager";
import { Asset } from "@/game/shapes/asset";
import { clampGridLine, l2gx, l2gy, l2gz } from "@/game/units";
import { visibilityStore } from "@/game/visibility/store";
import { addCDT, removeCDT } from "@/game/visibility/te/pa";
import { socket } from "../api/socket";
import { gameSettingsStore } from "../settings";
import { Shape } from "../shapes/shape";
import { gameStore } from "../store";
import { Floor } from "./floor";
import { floorStore, getFloorId, newFloorId } from "./store";

export function addFloor(serverFloor: ServerFloor): void {
    const floor: Floor = {
        id: newFloorId(),
        name: serverFloor.name,
        playerVisible: serverFloor.player_visible,
    };
    floorStore.addFloor({ floor, targetIndex: serverFloor.index });
    addCDT(getFloorId(serverFloor.name));
    for (const layer of serverFloor.layers) createLayer(layer, floor);

    // Recalculate zIndices
    let i = 0;
    for (const floor of floorStore.floors) {
        for (const layer of layerManager.getLayers(floor)) {
            layer.canvas.style.zIndex = `${i}`;
            i += 1;
        }
    }
}

export function removeFloor(floorId: number): void {
    removeCDT(floorId);
    visibilityStore.movementBlockers.splice(
        visibilityStore.movementBlockers.findIndex(mb => mb.floor === floorId),
        1,
    );
    visibilityStore.visionBlockers.splice(
        visibilityStore.visionBlockers.findIndex(vb => vb.floor === floorId),
        1,
    );
    visibilityStore.visionSources.splice(
        visibilityStore.visionSources.findIndex(vs => vs.floor === floorId),
        1,
    );
    const floor = floorStore.floors.find(f => f.id === floorId)!;
    for (const layer of layerManager.getLayers(floor)) layer.canvas.remove();
    floorStore.removeFloor(floor);
}

function createLayer(layerInfo: ServerLayer, floor: Floor): void {
    // Create canvas element
    const canvas = document.createElement("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create the Layer instance
    let layer: Layer;
    if (layerInfo.type_ === "grid") layer = new GridLayer(canvas, layerInfo.name, floor.id, layerInfo.index);
    else if (layerInfo.type_ === "fow") layer = new FowLightingLayer(canvas, layerInfo.name, floor.id, layerInfo.index);
    else if (layerInfo.type_ === "fow-players")
        layer = new FowVisionLayer(canvas, layerInfo.name, floor.id, layerInfo.index);
    else layer = new Layer(canvas, layerInfo.name, floor.id, layerInfo.index);
    layer.selectable = layerInfo.selectable;
    layer.playerEditable = layerInfo.player_editable;
    layerManager.addLayer(layer, floor.id);

    // Add the element to the DOM
    const layers = document.getElementById("layers");
    if (layers === null) {
        console.warn("Layers div is missing, this will prevent the main game board from loading!");
        return;
    }
    if (layerInfo.name !== "fow-players") layers.appendChild(canvas);
    // Load layer shapes
    layer.setServerShapes(layerInfo.shapes);
}

export function dropAsset(event: DragEvent): void {
    const layer = floorStore.currentLayer;
    if (layer === undefined || event === null || event.dataTransfer === null) return;
    const image = document.createElement("img");
    image.src = event.dataTransfer.getData("text/plain");
    const asset = new Asset(
        image,
        new GlobalPoint(l2gx(event.clientX), l2gy(event.clientY)),
        l2gz(image.width),
        l2gz(image.height),
    );
    asset.src = new URL(image.src).pathname;

    if (gameSettingsStore.useGrid) {
        const gs = gameStore.gridSize;
        asset.refPoint = new GlobalPoint(clampGridLine(asset.refPoint.x), clampGridLine(asset.refPoint.y));
        asset.w = Math.max(clampGridLine(asset.w), gs);
        asset.h = Math.max(clampGridLine(asset.h), gs);
    }

    layer.addShape(asset, SyncMode.FULL_SYNC, InvalidationMode.WITH_LIGHT);
}

export function snapToPoint(layer: Layer, endPoint: GlobalPoint, ignore?: GlobalPoint): [GlobalPoint, boolean] {
    const snapDistance = l2gz(20);
    let smallestPoint: [number, GlobalPoint] | undefined;
    for (const point of layer.points.keys()) {
        const gp = GlobalPoint.fromArray(JSON.parse(point));
        if (ignore && gp.equals(ignore)) continue;
        const l = endPoint.subtract(gp).length();

        if (l < (smallestPoint?.[0] ?? snapDistance)) smallestPoint = [l, gp];
    }
    if (smallestPoint !== undefined) endPoint = smallestPoint[1];
    return [endPoint, smallestPoint !== undefined];
}

export function moveFloor(shapes: Shape[], newFloor: Floor, sync: boolean): void {
    if (shapes.length === 0) return;
    const oldLayer = shapes[0].layer;
    const oldFloor = shapes[0].floor;
    if (shapes.some(s => s.layer !== oldLayer)) {
        throw new Error("Mixing shapes from different floors in shape move");
    }
    const newLayer = layerManager.getLayer(newFloor, oldLayer.name)!;
    for (const shape of shapes) {
        visibilityStore.moveShape({ shape, oldFloor: oldFloor.id, newFloor: newFloor.id });
        shape.setLayer(newFloor.id, oldLayer.name);
    }
    oldLayer.setShapes(...oldLayer.getShapes().filter(s => !shapes.includes(s)));
    newLayer.pushShapes(...shapes);
    oldLayer.invalidate(false);
    newLayer.invalidate(false);
    if (sync) socket.emit("Shapes.Floor.Change", { uuids: shapes.map(s => s.uuid), floor: newFloor.name });
}

export function moveLayer(shapes: Shape[], newLayer: Layer, sync: boolean): void {
    if (shapes.length === 0) return;
    const oldLayer = shapes[0].layer;
    // const newLayer = layerManager.getLayer(layerManager.getFloor(this._floor)!, layer);
    if (shapes.some(s => s.layer !== oldLayer)) {
        throw new Error("Mixing shapes from different floors in shape move");
    }
    for (const shape of shapes) shape.setLayer(newLayer.floor, newLayer.name);
    // Update layer shapes
    oldLayer.setShapes(...oldLayer.getShapes().filter(s => !shapes.includes(s)));
    newLayer.pushShapes(...shapes);
    // Revalidate layers  (light should at most be redone once)
    oldLayer.invalidate(true);
    newLayer.invalidate(false);
    // Sync!
    if (sync)
        socket.emit("Shapes.Layer.Change", {
            uuids: shapes.map(s => s.uuid),
            layer: newLayer.name,
            floor: newLayer.floor,
        });
}

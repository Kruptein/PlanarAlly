import { AssetList, SyncMode } from "@/core/comm/types";
import "@/game/api/events/access";
import "@/game/api/events/floor";
import "@/game/api/events/labels";
import "@/game/api/events/location";
import "@/game/api/events/room";
import "@/game/api/events/shape";
import { socket } from "@/game/api/socket";
import { Note, ServerFloor } from "@/game/comm/types/general";
import { EventBus } from "@/game/event-bus";
import { GlobalPoint } from "@/game/geom";
import { layerManager } from "@/game/layers/manager";
import { addFloor } from "@/game/layers/utils";
import { gameManager } from "@/game/manager";
import { gameStore } from "@/game/store";
import { router } from "@/router";
import { coreStore } from "../../core/store";
import { ServerClient } from "../comm/types/settings";
import { floorStore } from "../layers/store";
import { zoomDisplay } from "../utils";
import { visibilityStore } from "../visibility/store";

// Core WS events

socket.on("connect", () => {
    console.log("Connected");
    socket.emit("Location.Load");
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

// Bootup events

socket.on("Client.Options.Set", (options: ServerClient) => {
    gameStore.setUsername(options.name);
    gameStore.setDM(options.name === decodeURIComponent(window.location.pathname.split("/")[2]));

    gameStore.setGridSize({ gridSize: options.grid_size, sync: false });
    gameStore.setGridColour({ colour: options.grid_colour, sync: false });
    gameStore.setFOWColour({ colour: options.fow_colour, sync: false });
    gameStore.setRulerColour({ colour: options.ruler_colour, sync: false });
    gameStore.setInvertAlt({ invertAlt: options.invert_alt, sync: false });
    gameStore.setPanX(options.pan_x);
    gameStore.setPanY(options.pan_y);
    gameStore.setZoomDisplay(zoomDisplay(options.zoom_factor));

    socket.once("Board.Floor.Set", () => {
        if (options.active_layer) layerManager.selectLayer(options.active_layer, false);
    });
});

socket.on("Board.Locations.Set", (locationInfo: { id: number; name: string }[]) => {
    gameStore.clear();
    visibilityStore.clear();
    gameStore.setLocations({ locations: locationInfo, sync: false });
    document.getElementById("layers")!.innerHTML = "";
    floorStore.reset();
    layerManager.reset();
    EventBus.$emit("Initiative.Clear");
});

socket.on("Board.Floor.Set", (floor: ServerFloor) => {
    addFloor(floor);
    visibilityStore.recalculateVision(floor.name);
    visibilityStore.recalculateMovement(floor.name);
    if (floorStore.floors.length === 1) {
        floorStore.selectFloor({ targetFloor: floor.name, sync: false });
        requestAnimationFrame(layerManager.drawLoop);
        coreStore.setLoading(false);
        gameStore.setBoardInitialized(true);
    }
});

// Varia

socket.on("Position.Set", (data: { floor: string; x: number; y: number; zoom: number }) => {
    floorStore.selectFloor({ targetFloor: data.floor, sync: false });
    gameStore.setZoomDisplay(data.zoom);
    gameManager.setCenterPosition(new GlobalPoint(data.x, data.y));
});

socket.on("Notes.Set", (notes: Note[]) => {
    for (const note of notes) gameStore.newNote({ note, sync: false });
});

socket.on("Markers.Set", (markers: string[]) => {
    for (const marker of markers) gameStore.newMarker({ marker, sync: false });
});

socket.on("Asset.List.Set", (assets: AssetList) => {
    gameStore.setAssets(assets);
});

socket.on("Temp.Clear", (shapeIds: string[]) => {
    for (const shapeId of shapeIds) {
        if (!layerManager.UUIDMap.has(shapeId)) {
            console.log("Attempted to remove an unknown temporary shape");
            continue;
        }
        const shape = layerManager.UUIDMap.get(shapeId)!;
        if (!layerManager.hasLayer(shape.floor, shape.layer.name)) {
            console.log(`Attempted to remove shape from an unknown layer ${shape.layer.name}`);
            continue;
        }
        const realShape = layerManager.UUIDMap.get(shape.uuid)!;
        shape.layer.removeShape(realShape, SyncMode.NO_SYNC);
    }
});

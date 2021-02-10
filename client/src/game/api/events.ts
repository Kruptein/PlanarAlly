import { AssetList, SyncMode } from "@/core/models/types";
import "@/game/api/events/access";
import "@/game/api/events/client";
import "@/game/api/events/floor";
import "@/game/api/events/groups";
import "@/game/api/events/initiative";
import "@/game/api/events/labels";
import "@/game/api/events/location";
import "@/game/api/events/notification";
import "@/game/api/events/player";
import "@/game/api/events/room";
import "@/game/api/events/shape/core";
import "@/game/api/events/shape/options";
import "@/game/api/events/shape/togglecomposite";
import { socket } from "@/game/api/socket";
import { EventBus } from "@/game/event-bus";
import { GlobalPoint } from "@/game/geom";
import { layerManager } from "@/game/layers/manager";
import { addFloor } from "@/game/layers/utils";
import { gameManager } from "@/game/manager";
import { Note, ServerFloor } from "@/game/models/general";
import { gameStore } from "@/game/store";
import { router } from "@/router";

import { coreStore } from "../../core/store";
import { floorStore } from "../layers/store";
import { Location } from "../models/settings";
import { deleteShapes } from "../shapes/utils";
import { visibilityStore } from "../visibility/store";

// Core WS events

socket.on("connect", () => {
    console.log("Connected");
    gameStore.setConnected(true);
    socket.emit("Location.Load");
});
socket.on("disconnect", (reason: string) => {
    gameStore.setConnected(false);
    console.log("Disconnected");
    if (reason === "io server disconnect") socket.open();
});
socket.on("connect_error", (error: any) => {
    console.error("Could not connect to game session.");
    if (error.message === "Connection rejected by server") {
        router.push({ name: "dashboard", params: { error: "join_game" } });
    }
});
socket.on("error", (_error: any) => {
    console.error("Game session does not exist.");
    router.push({ name: "dashboard", params: { error: "join_game" } });
});
socket.on("redirect", (destination: string) => {
    console.log("redirecting");
    router.push(destination);
});

// Bootup events

socket.on("Board.Locations.Set", (locationInfo: Location[]) => {
    gameStore.clear();
    visibilityStore.clear();
    gameStore.setLocations({ locations: locationInfo, sync: false });
    document.getElementById("layers")!.innerHTML = "";
    floorStore.reset();
    layerManager.reset();
    EventBus.$emit("Initiative.Clear");
});

socket.on("Board.Floor.Set", async (floor: ServerFloor) => {
    // It is important that this condition is evaluated before the async addFloor call.
    // The very first floor that arrives is the one we want to select
    // When this condition is evaluated after the await, we are at the mercy of the async scheduler
    const selectFloor = floorStore.floors.length === 0;
    await addFloor(floor);

    if (selectFloor) {
        floorStore.selectFloor({ targetFloor: floor.name, sync: false });
        requestAnimationFrame(layerManager.drawLoop);
        coreStore.setLoading(false);
        gameStore.setBoardInitialized(true);
        EventBus.$emit(`Board.Floor.Set`);
    }
});

// Varia

socket.on("Position.Set", (data: { floor?: string; x: number; y: number; zoom?: number }) => {
    if (data.floor) floorStore.selectFloor({ targetFloor: data.floor, sync: false });
    if (data.zoom) gameStore.setZoomDisplay(data.zoom);
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
    // We use ! on the get here even though to silence the typechecker as we filter undefineds later.
    const shapes = shapeIds.map((s) => layerManager.UUIDMap.get(s)!).filter((s) => s !== undefined);
    deleteShapes(shapes, SyncMode.NO_SYNC);
});

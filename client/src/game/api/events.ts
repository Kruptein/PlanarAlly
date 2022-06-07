import "../systems/access/events";
import "../systems/auras/events";
import "../systems/logic/door/events";
import "../systems/logic/tp/events";
import "../systems/trackers/events";

import "./events/dice";
import "./events/floor";
import "./events/groups";
import "./events/initiative";
import "./events/labels";
import "./events/location";
import "./events/logic";
import "./events/notification";
import "./events/player";
import "./events/room";
import "./events/shape/circularToken";
import "./events/shape/core";
import "./events/shape/options";
import "./events/shape/text";
import "./events/shape/togglecomposite";
import "./events/user";

import { toGP } from "../../core/geometry";
import { SyncMode } from "../../core/models/types";
import type { AssetList } from "../../core/models/types";
import { debugLayers } from "../../localStorageHelpers";
import { router } from "../../router";
import { clientStore } from "../../store/client";
import { coreStore } from "../../store/core";
import { floorStore } from "../../store/floor";
import { gameStore } from "../../store/game";
import { locationStore } from "../../store/location";
import { convertAssetListToMap } from "../assets/utils";
import { clearGame } from "../clear";
import { startDrawLoop } from "../draw";
import { getLocalId, getShapeFromGlobal } from "../id";
import type { GlobalId } from "../id";
import type { Note, ServerFloor } from "../models/general";
import type { Location } from "../models/settings";
import { setCenterPosition } from "../position";
import { deleteShapes } from "../shapes/utils";

import { sendClientLocationOptions } from "./emits/client";
import { activeLayerToselect } from "./events/client";
import { socket } from "./socket";

// Core WS events

socket.on("connect", () => {
    console.log("Connected");
    gameStore.setConnected(true);
    socket.emit("Location.Load");
    coreStore.setLoading(true);
});
socket.on("disconnect", (reason: string) => {
    gameStore.setConnected(false);
    console.log("Disconnected");
    if (reason === "io server disconnect") socket.open();
});
socket.on("connect_error", async (error: any) => {
    console.error("Could not connect to game session.");
    if (error.message === "Connection rejected by server") {
        await router.push({ name: "dashboard", params: { error: "join_game" } });
    }
});
socket.on("error", async (_error: any) => {
    console.error("Game session does not exist.");
    await router.push({ name: "dashboard", params: { error: "join_game" } });
});
socket.on("redirect", async (destination: string) => {
    console.log("redirecting");
    await router.push(destination);
});

// Bootup events

socket.on("CLEAR", clearGame);

socket.on("Board.Locations.Set", (locationInfo: Location[]) => {
    locationStore.setLocations(locationInfo, false);
});

socket.on("Board.Floor.Set", (floor: ServerFloor) => {
    // It is important that this condition is evaluated before the async addFloor call.
    // The very first floor that arrives is the one we want to select
    // When this condition is evaluated after the await, we are at the mercy of the async scheduler
    const selectFloor = floorStore.state.floors.length === 0;
    if (debugLayers)
        console.log(
            `Adding floor ${floor.name} [${floor.layers.reduce((acc, cur) => acc + cur.shapes.length, 0)} shapes]`,
        );
    floorStore.addServerFloor(floor);
    if (debugLayers) console.log("Done.");

    if (selectFloor) {
        floorStore.selectFloor({ name: floor.name }, false);
        startDrawLoop();
        coreStore.setLoading(false);
        gameStore.setBoardInitialized(true);
        if (activeLayerToselect !== undefined) floorStore.selectLayer(activeLayerToselect, false);
        // Send initial viewport on connect (this can change due to other monitors etc)
        sendClientLocationOptions();
    }
});

// Varia

socket.on("Position.Set", (data: { floor?: string; x: number; y: number; zoom?: number }) => {
    if (data.floor !== undefined) floorStore.selectFloor({ name: data.floor }, true);
    if (data.zoom !== undefined) clientStore.setZoomDisplay(data.zoom);
    setCenterPosition(toGP(data.x, data.y));
});

socket.on("Notes.Set", (notes: Note[]) => {
    for (const note of notes) gameStore.newNote(note, false);
});

socket.on("Asset.List.Set", (assets: AssetList) => {
    gameStore.setAssets(convertAssetListToMap(assets));
});

socket.on("Markers.Set", (markers: GlobalId[]) => {
    for (const marker of markers) gameStore.newMarker(getLocalId(marker)!, false);
});

socket.on("Temp.Clear", (shapeIds: GlobalId[]) => {
    const shapes = shapeIds.map((s) => getShapeFromGlobal(s)!).filter((s) => s !== undefined);
    deleteShapes(shapes, SyncMode.NO_SYNC);
});

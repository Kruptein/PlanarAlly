import "../systems/access/events";
import "../systems/auras/events";
import "../systems/labels/events";
import "../systems/logic/door/events";
import "../systems/logic/tp/events";
import "../systems/markers/events";
import "../systems/notes/events";
import "../systems/trackers/events";

import "./events/client";
import "./events/dice";
import "./events/floor";
import "./events/initiative";
import "./events/lg";
import "./events/location";
import "./events/logic";
import "./events/notification";
import "./events/player/options";
import "./events/player/player";
import "./events/player/players";
import "./events/room";
import "./events/shape/asset";
import "./events/shape/circularToken";
import "./events/shape/core";
import "./events/shape/options";
import "./events/shape/text";
import "./events/shape/togglecomposite";
import "./events/user";

import "./gbsocket"; // Start tuio listener

import type { ApiFloor } from "../../apiTypes";
import { toGP } from "../../core/geometry";
import { SyncMode } from "../../core/models/types";
import type { AssetList } from "../../core/models/types";
import { debugLayers } from "../../localStorageHelpers";
import { router } from "../../router";
import { coreStore } from "../../store/core";
import { locationStore } from "../../store/location";
import { convertAssetListToMap } from "../assets/utils";
import { clearGame } from "../clear";
import { addServerFloor } from "../floor/server";
import { getShapeFromGlobal } from "../id";
import type { GlobalId } from "../id";
import type { Location } from "../models/settings";
import { setCenterPosition } from "../position";
import { deleteShapes } from "../shapes/utils";
import { floorSystem } from "../systems/floors";
import { floorState } from "../systems/floors/state";
import { gameSystem } from "../systems/game";
import { playerSystem } from "../systems/players";
import { positionSystem } from "../systems/position";

import { socket } from "./socket";

// Core WS events

socket.on("connect", () => {
    console.log("Connected");
    gameSystem.setConnected(true);

    if (coreStore.state.boardId !== undefined) {
        console.log("BOARDID FOUND, SENDING TO SERVER", coreStore.state.boardId);
        socket.emit("Client.Gameboard.Set", coreStore.state.boardId);
    }

    socket.emit("Location.Load");
    coreStore.setLoading(true);
});
socket.on("disconnect", (reason: string) => {
    gameSystem.setConnected(false);
    console.log("Disconnected");
    if (reason === "io server disconnect") socket.open();
});
socket.on("connect_error", async (error: Error) => {
    console.error("Could not connect to game session.");
    if (error.message === "Connection rejected by server") {
        await router.push({ name: "games", params: { error: "join_game" } });
    }
});
socket.on("error", async (_error: any) => {
    console.error("Game session does not exist.");
    await router.push({ name: "games", params: { error: "join_game" } });
});
socket.on("redirect", async (destination: string) => {
    console.log("redirecting");
    await router.push(destination);
});

// Bootup events

socket.on("CLEAR", () => clearGame(false));
socket.on("PARTIAL-CLEAR", () => clearGame(true));

socket.on("Board.Locations.Set", (locationInfo: Location[]) => {
    locationStore.setLocations(locationInfo, false);
});

socket.on("Board.Floor.Set", (floor: ApiFloor) => {
    // It is important that this condition is evaluated before the async addFloor call.
    // The very first floor that arrives is the one we want to select
    // When this condition is evaluated after the await, we are at the mercy of the async scheduler
    const selectFloor = floorState.raw.floors.length === 0;
    if (debugLayers)
        console.log(
            `Adding floor ${floor.name} [${floor.layers.reduce((acc, cur) => acc + cur.shapes.length, 0)} shapes]`,
        );
    addServerFloor(floor);
    if (debugLayers) console.log("Done.");

    if (selectFloor) {
        floorSystem.selectFloor({ name: floor.name }, false);
        coreStore.setLoading(false);
        gameSystem.setBoardInitialized(true);
        playerSystem.loadPosition();
    }
});

// Varia

socket.on("Position.Set", (data: { floor?: string; x: number; y: number; zoom?: number }) => {
    if (data.floor !== undefined) floorSystem.selectFloor({ name: data.floor }, true);
    if (data.zoom !== undefined)
        positionSystem.setZoomDisplay(data.zoom, { invalidate: false, updateSectors: false, sync: false });
    setCenterPosition(toGP(data.x, data.y));
});

socket.on("Asset.List.Set", (assets: AssetList) => {
    gameSystem.setAssets(convertAssetListToMap(assets));
});

socket.on("Temp.Clear", (shapeIds: GlobalId[]) => {
    const shapes = shapeIds.map((s) => getShapeFromGlobal(s)!).filter((s) => s !== undefined);
    deleteShapes(shapes, SyncMode.NO_SYNC);
});

import "../systems/access/events";
import "../systems/assets/events";
import "../systems/auras/events";
import "../systems/characters/events";
import "../systems/chat/events";
import "../systems/dice/events";
import "../systems/groups/events";
import "../systems/logic/door/events";
import "../systems/logic/tp/events";
import "../systems/markers/events";
import "../systems/notes/events";
import "../systems/room/events";
import "../systems/trackers/events";

import "./events/client";
import "./events/floor";
import "./events/initiative";
import "./events/location";
import "./events/logic";
import "./events/notification";
import "./events/player/options";
import "./events/player/player";
import "./events/player/players";
import "./events/shape/asset";
import "./events/shape/circularToken";
import "./events/shape/core";
import "./events/shape/options";
import "./events/shape/text";
import "./events/shape/togglecomposite";
import "./events/user";

import type { ApiFloor, ApiLocationCore, PlayerPosition } from "../../apiTypes";
import { toGP } from "../../core/geometry";
import type { GlobalId } from "../../core/id";
import { SyncMode } from "../../core/models/types";
import { debugLayers } from "../../localStorageHelpers";
import { modEvents } from "../../mods/events";
import { router } from "../../router";
import { coreStore } from "../../store/core";
import { locationStore } from "../../store/location";
import { clearGame } from "../clear";
import { addServerFloor } from "../floor/server";
import { getShapeFromGlobal } from "../id";
import { setCenterPosition } from "../position";
import { deleteShapes } from "../shapes/utils";
import { floorSystem } from "../systems/floors";
import { floorState } from "../systems/floors/state";
import { gameSystem } from "../systems/game";
import { playerSystem } from "../systems/players";

import { socket } from "./socket";

// Core WS events

socket.on("connect", () => {
    console.log("[Game] connected");
    gameSystem.setConnected(true);

    socket.emit("Location.Load");
    coreStore.setLoading(true);
});
socket.on("disconnect", (reason: string) => {
    gameSystem.setConnected(false);
    console.log("[Game] disconnected");
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

socket.on("CLEAR", () => clearGame("full-loading"));
socket.on("PARTIAL-CLEAR", () => clearGame("partial-loading"));

socket.on("Board.Locations.Set", (locationInfo: ApiLocationCore[]) => {
    locationStore.setLocations(locationInfo, false);
});

socket.on("Location.Loaded", async () => await modEvents.locationLoaded());

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

socket.on("Position.Set", (data: PlayerPosition) => {
    if (data.floor !== undefined) floorSystem.selectFloor({ name: data.floor }, true);
    setCenterPosition(toGP(data.x, data.y));
});

socket.on("Temp.Clear", (shapeIds: GlobalId[]) => {
    const shapes = shapeIds.map((s) => getShapeFromGlobal(s)!).filter((s) => s !== undefined);
    deleteShapes(shapes, SyncMode.NO_SYNC);
});

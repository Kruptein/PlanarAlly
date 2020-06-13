import { AssetList, SyncMode } from "@/core/comm/types";
import "@/game/api/events/access";
import "@/game/api/events/location";
import { setLocationOptions } from "@/game/api/events/location";
import "@/game/api/events/shape";
import { socket } from "@/game/api/socket";
import { BoardInfo, Note, ServerFloor } from "@/game/comm/types/general";
import { EventBus } from "@/game/event-bus";
import { GlobalPoint } from "@/game/geom";
import { layerManager } from "@/game/layers/manager";
import { addFloor, removeFloor } from "@/game/layers/utils";
import { gameManager } from "@/game/manager";
import { gameStore } from "@/game/store";
import { router } from "@/router";
import { coreStore } from "../../core/store";
import { optionsToClient, ServerClient, ServerLocationOptions } from "../comm/types/settings";
import { gameSettingsStore } from "../settings";
import { zoomDisplay } from "../utils";
import { visibilityStore } from "../visibility/store";

socket.on("connect", () => {
    console.log("Connected");
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
socket.on(
    "Room.Info.Set",
    (data: {
        name: string;
        creator: string;
        invitationCode: string;
        isLocked: boolean;
        default_options: ServerLocationOptions;
        players: { id: number; name: string; location: number; role: number }[];
    }) => {
        gameStore.setRoomName(data.name);
        gameStore.setRoomCreator(data.creator);
        gameStore.setInvitationCode(data.invitationCode);
        gameStore.setIsLocked({ isLocked: data.isLocked, sync: false });
        gameStore.setPlayers(data.players);
        gameSettingsStore.setDefaultLocationOptions(optionsToClient(data.default_options));
        setLocationOptions(null, data.default_options);
    },
);
socket.on("Room.Info.InvitationCode.Set", (invitationCode: string) => {
    gameStore.setInvitationCode(invitationCode);
    EventBus.$emit("DmSettings.RefreshedInviteCode");
});
socket.on("Room.Info.Players.Add", (data: { id: number; name: string; location: number; role: number }) => {
    gameStore.addPlayer(data);
});
socket.on("Username.Set", (username: string) => {
    gameStore.setUsername(username);
    gameStore.setDM(username === decodeURIComponent(window.location.pathname.split("/")[2]));
});
socket.on("Client.Options.Set", (options: ServerClient) => {
    gameStore.setGridColour({ colour: options.grid_colour, sync: false });
    gameStore.setFOWColour({ colour: options.fow_colour, sync: false });
    gameStore.setRulerColour({ colour: options.ruler_colour, sync: false });
    gameStore.setInvertAlt({ invertAlt: options.invert_alt, sync: false });
    gameStore.setPanX(options.pan_x);
    gameStore.setPanY(options.pan_y);
    gameStore.setZoomDisplay(zoomDisplay(options.zoom_factor));
    // gameStore.setZoomDisplay(0.5);
    if (options.active_layer && options.active_floor) {
        gameStore.selectFloor({ targetFloor: options.active_floor, sync: false });
        layerManager.selectLayer(options.active_layer, false);
    }
    for (const floor of layerManager.floors) {
        if (layerManager.getGridLayer(floor.name) !== undefined) layerManager.getGridLayer(floor.name)!.invalidate();
    }
});
socket.on("Position.Set", (data: { floor: string; x: number; y: number; zoom: number }) => {
    gameStore.selectFloor({ targetFloor: data.floor, sync: false });
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
socket.on("Board.Set", (locationInfo: BoardInfo) => {
    gameStore.clear();
    visibilityStore.clear();
    gameStore.setLocations({ locations: locationInfo.locations, sync: false });
    document.getElementById("layers")!.innerHTML = "";
    gameStore.resetLayerInfo();
    layerManager.reset();
    for (const floor of locationInfo.floors) addFloor(floor);
    EventBus.$emit("Initiative.Clear");
    for (const floor of layerManager.floors) {
        visibilityStore.recalculateVision(floor.name);
        visibilityStore.recalculateMovement(floor.name);
    }
    gameStore.selectFloor({ targetFloor: 0, sync: false });
    gameStore.setBoardInitialized(true);
});
socket.on("Floor.Create", (data: { floor: ServerFloor; creator: string }) => {
    addFloor(data.floor);
    if (data.creator === coreStore.username) gameStore.selectFloor({ targetFloor: data.floor.name, sync: true });
});
socket.on("Floor.Remove", removeFloor);
socket.on("Temp.Clear", (shapeIds: string[]) => {
    for (const shapeId of shapeIds) {
        if (!layerManager.UUIDMap.has(shapeId)) {
            console.log("Attempted to remove an unknown temporary shape");
            continue;
        }
        const shape = layerManager.UUIDMap.get(shapeId)!;
        if (!layerManager.hasLayer(shape.floor, shape.layer)) {
            console.log(`Attempted to remove shape from an unknown layer ${shape.layer}`);
            continue;
        }
        const realShape = layerManager.UUIDMap.get(shape.uuid)!;
        layerManager.getLayer(shape.floor, shape.layer)!.removeShape(realShape, SyncMode.NO_SYNC);
    }
});
socket.on("Labels.Set", (labels: Label[]) => {
    for (const label of labels) gameStore.addLabel(label);
});
socket.on("Label.Visibility.Set", (data: { user: string; uuid: string; visible: boolean }) => {
    gameStore.setLabelVisibility(data);
});
socket.on("Label.Add", (data: Label) => {
    gameStore.addLabel(data);
});
socket.on("Label.Delete", (data: { user: string; uuid: string }) => {
    gameStore.deleteLabel(data);
});
socket.on("Labels.Filter.Add", (uuid: string) => {
    gameStore.labelFilters.push(uuid);
    layerManager.invalidateAllFloors();
});
socket.on("Labels.Filter.Remove", (uuid: string) => {
    const idx = gameStore.labelFilters.indexOf(uuid);
    if (idx >= 0) {
        gameStore.labelFilters.splice(idx, 1);
        layerManager.invalidateAllFloors();
    }
});
socket.on("Labels.Filters.Set", (filters: string[]) => {
    gameStore.setLabelFilters(filters);
});

import Vuex from "vuex";
import { Module, VuexModule, Mutation } from 'vuex-module-decorators';

import gameManager from "./manager";

import { AssetList } from "../core/comm/types";
import { sendClientOptions, socket } from "./comm/socket";
import { Note } from "./comm/types/general";
import { GlobalPoint } from "./geom";
import { g2l, l2g } from "./units";

@Module
export default class GameStore extends VuexModule {
    // This is a limited view of selectable layers that is used to generate the layer selection UI and ability to switch layers
    // See the GameManager.LayerManager for proper layer management tools
    layers: string[] = [];
    selectedLayerIndex = -1;
    boardInitialized = false;

    locations: string[] = [];

    assets: AssetList = {};

    notes: Note[] = [];

    IS_DM = false;
    gridSize = 50;
    username = "";
    roomName = "";
    roomCreator = "";
    invitationCode = "";

    gridColour = "rgba(0, 0, 0, 1)";
    fowColour = "rgba(0, 0, 0, 1)";
    rulerColour = "rgba(255, 0, 0, 1)";
    panX = 0;
    panY = 0;
    zoomFactor = 1;

    unitSize = 5;
    useGrid = true;
    fullFOW = false;
    fowOpacity = 0.3;
    fowLOS = false;
    locationName = "";

    get selectedLayer() {
        return this.layers[this.selectedLayerIndex];
    }

    @Mutation
    setBoardInitialized(boardInitialized: boolean) {
        this.boardInitialized = boardInitialized;
    }

    @Mutation
    setDM(isDM: boolean) {
        this.IS_DM = isDM;
    }

    @Mutation
    setUsername(username: string) {
        this.username = username;
    }

    @Mutation
    addLayer(name: string) {
        this.layers.push(name);
        if (this.selectedLayerIndex === -1)
            this.selectedLayerIndex = this.layers.indexOf(name);
    }

    @Mutation
    selectLayer(name: string, sync: boolean) {
        const index = this.layers.indexOf(name);
        if (index >= 0) this.selectedLayerIndex = index;
        if (sync)
            socket.emit("Client.ActiveLayer.Set", name);
    }
}

//     mutations: {
//         setBoardInitialized(state, boardInitialized) {
//             state.boardInitialized = boardInitialized;
//         },
//         setDM(state, isDM) {
//             state.IS_DM = isDM;
//         },
//         setUsername(state, username) {
//             state.username = username;
//         },
//         addLayer(state, name) {
//             state.layers.push(name);
//             if (state.selectedLayerIndex === -1) state.selectedLayerIndex = state.layers.indexOf(name);
//         },
//         selectLayer(state, payload: { name: string, sync: boolean }) {
//             const index = state.layers.indexOf(payload.name);
//             if (index >= 0) state.selectedLayerIndex = index;
//             if (payload.sync) {
//                 socket.emit("Client.ActiveLayer.Set", payload.name);
//             }
//         },
//         setRoomName(state, name) {
//             state.roomName = name;
//         },
//         setRoomCreator(state, name) {
//             state.roomCreator = name;
//         },
//         setInvitationCode(state, code) {
//             state.invitationCode = code;
//         },
//         setGridColour(state, payload: { colour: string; sync: boolean }) {
//             state.gridColour = payload.colour;
//             gameManager.layerManager.getGridLayer()!.drawGrid();
//             if (payload.sync) socket.emit("Client.Options.Set", { gridColour: payload.colour });
//         },
//         setFOWColour(state, payload: { colour: string; sync: boolean }) {
//             state.fowColour = payload.colour;
//             gameManager.layerManager.invalidate();
//             if (payload.sync) socket.emit("Client.Options.Set", { fowColour: payload.colour });
//         },
//         setRulerColour(state, payload: { colour: string; sync: boolean }) {
//             state.rulerColour = payload.colour;
//             if (payload.sync) socket.emit("Client.Options.Set", { rulerColour: payload.colour });
//         },
//         setPanX(state, x) {
//             state.panX = x;
//         },
//         setPanY(state, y) {
//             state.panY = y;
//         },
//         setZoomFactor(state, zoomFactor) {
//             state.zoomFactor = zoomFactor;
//         },
//         increasePanX(state, increase) {
//             state.panX += increase;
//         },
//         increasePanY(state, increase) {
//             state.panY += increase;
//         },
//         updateZoom(state, payload: { newZoomValue: number; zoomLocation: GlobalPoint }) {
//             if (payload.newZoomValue === state.zoomFactor) return;
//             if (payload.newZoomValue < 0.1) payload.newZoomValue = 0.1;
//             if (payload.newZoomValue > 5) payload.newZoomValue = 5;

//             const oldLoc = g2l(payload.zoomLocation);

//             state.zoomFactor = payload.newZoomValue;

//             const newLoc = l2g(oldLoc);

//             // Change the pan settings to keep the zoomLocation in the same exact location before and after the zoom.
//             const diff = newLoc.subtract(payload.zoomLocation);
//             state.panX += diff.x;
//             state.panY += diff.y;

//             gameManager.layerManager.invalidate();
//             sendClientOptions();
//         },
//         setUnitSize(state, payload: { unitSize: number; sync: boolean }) {
//             if (state.unitSize !== payload.unitSize) {
//                 state.unitSize = payload.unitSize;
//                 if (gameManager.layerManager.getGridLayer() !== undefined)
//                     gameManager.layerManager.getGridLayer()!.drawGrid();
//                 if (payload.sync) socket.emit("Location.Options.Set", { unit_size: payload.unitSize });
//             }
//         },
//         setUseGrid(state, payload: { useGrid: boolean; sync: boolean }) {
//             if (state.useGrid !== payload.useGrid) {
//                 state.useGrid = payload.useGrid;
//                 const gridLayer = gameManager.layerManager.getGridLayer()!;
//                 if (payload.useGrid) gridLayer.canvas.style.display = "block";
//                 else gridLayer.canvas.style.display = "none";
//                 if (payload.sync) socket.emit("Location.Options.Set", { use_grid: payload.useGrid });
//             }
//         },
//         setGridSize(state, payload: { gridSize: number; sync: boolean }): void {
//             if (state.gridSize !== payload.gridSize && payload.gridSize > 0) {
//                 state.gridSize = payload.gridSize;
//                 const gridLayer = gameManager.layerManager.getGridLayer();
//                 if (gridLayer !== undefined) gridLayer.drawGrid();
//                 if (payload.sync) socket.emit("Gridsize.Set", payload.gridSize);
//             }
//         },
//         setFullFOW(state, payload: { fullFOW: boolean; sync: boolean }) {
//             if (state.fullFOW !== payload.fullFOW) {
//                 state.fullFOW = payload.fullFOW;
//                 gameManager.layerManager.invalidateLight();
//                 if (payload.sync) socket.emit("Location.Options.Set", { full_fow: payload.fullFOW });
//             }
//         },
//         setFOWOpacity(state, payload: { fowOpacity: number; sync: boolean }) {
//             state.fowOpacity = payload.fowOpacity;
//             gameManager.layerManager.invalidateLight();
//             if (payload.sync) socket.emit("Location.Options.Set", { fow_opacity: payload.fowOpacity });
//         },
//         setLineOfSight(state, payload: { fowLOS: boolean; sync: boolean }) {
//             if (state.fowLOS !== payload.fowLOS) {
//                 state.fowLOS = payload.fowLOS;
//                 gameManager.layerManager.invalidate();
//                 if (payload.sync) socket.emit("Location.Options.Set", { fow_los: payload.fowLOS });
//             }
//         },
//         setLocationName(state, name) {
//             state.locationName = name;
//         },
//         setLocations(state, locations: string[]) {
//             state.locations = locations;
//         },
//         resetLayerInfo(state) {
//             state.layers = [];
//             state.selectedLayerIndex = -1;
//         },
//         setAssets(state, assets) {
//             state.assets = assets;
//         },
//         newNote(state, payload: { note: Note; sync: boolean }) {
//             state.notes.push(payload.note);
//             if (payload.sync) socket.emit("Note.New", payload.note);
//         },
//         updateNote(state, payload: { note: Note; sync: boolean }) {
//             const note = state.notes.find(n => n.uuid === payload.note.uuid);
//             if (note === undefined) return;
//             note.title = payload.note.title;
//             note.text = payload.note.text;
//             if (payload.sync) socket.emit("Note.Update", payload.note);
//         },
//         removeNote(state, payload: { note: Note; sync: boolean }) {
//             state.notes = state.notes.filter(n => n.uuid !== payload.note.uuid);
//             if (payload.sync) socket.emit("Note.Remove", payload.note.uuid);
//         },
//     },
// });

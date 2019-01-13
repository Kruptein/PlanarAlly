// import Vuex from "vuex";
import { Action, getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";

import { AssetList } from "@/core/comm/types";
import { socket } from "@/game/api/socket";
import { sendClientOptions } from "@/game/api/utils";
import { Note } from "@/game/comm/types/general";
import { GlobalPoint } from "@/game/geom";
import { layerManager } from "@/game/layers/manager";
import { g2l, l2g } from "@/game/units";
import { BoundingVolume } from "@/game/visibility/bvh/bvh";
import { rootStore } from "@/store";
import { triangulate } from "./visibility/te/pa";

export interface GameState {
    boardInitialized: boolean;
}

@Module({ dynamic: true, store: rootStore, name: "game", namespaced: true })
class GameStore extends VuexModule {
    // This is a limited view of selectable layers that is used to generate the layer selection UI and ability to switch layers
    // See the layerManager for proper layer management tools
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

    visionSources: { shape: string; aura: string }[] = [];
    visionBlockers: string[] = [];
    annotations: string[] = [];
    movementblockers: string[] = [];
    ownedtokens: string[] = [];

    BV = Object.freeze(new BoundingVolume([]));

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
    setRoomName(name: string) {
        this.roomName = name;
    }

    @Mutation
    setRoomCreator(name: string) {
        this.roomCreator = name;
    }

    @Mutation
    setInvitationCode(code: string) {
        this.invitationCode = code;
    }

    @Mutation
    addLayer(name: string) {
        this.layers.push(name);
        if (this.selectedLayerIndex === -1) this.selectedLayerIndex = this.layers.indexOf(name);
    }

    @Mutation
    selectLayer(data: { name: string; sync: boolean }) {
        const index = this.layers.indexOf(data.name);
        if (index >= 0) this.selectedLayerIndex = index;
        if (data.sync) socket.emit("Client.ActiveLayer.Set", data.name);
    }

    @Mutation
    newNote(data: { note: Note; sync: boolean }) {
        this.notes.push(data.note);
        if (data.sync) socket.emit("Note.New", data.note);
    }

    @Mutation
    setAssets(assets: AssetList) {
        this.assets = assets;
    }

    @Mutation
    setLocations(locations: string[]) {
        this.locations = locations;
    }

    @Mutation
    resetLayerInfo() {
        this.layers = [];
        this.selectedLayerIndex = -1;
    }

    @Mutation
    recalculateBV(partial = false) {
        // TODO: This needs to be cleaned up..
        if (this.boardInitialized) {
            console.time("BV");
            triangulate(partial);
            console.timeEnd("BV");
            // let success = false;
            // let tries = 0;
            // while (!success) {
            //     success = true;
            //     try {
            //         this.BV = Object.freeze(new BoundingVolume(this.visionBlockers));
            //     } catch (error) {
            //         success = false;
            //         tries++;
            //         if (tries > 10) {
            //             console.error(error);
            //             return;
            //         }
            //     }
            // }
        }
    }

    @Mutation
    updateZoom(data: { newZoomValue: number; zoomLocation: GlobalPoint }) {
        if (data.newZoomValue === this.zoomFactor) return;
        if (data.newZoomValue < 0.1) data.newZoomValue = 0.01;
        if (data.newZoomValue > 5) data.newZoomValue = 5;

        const oldLoc = g2l(data.zoomLocation);

        this.zoomFactor = data.newZoomValue;

        const newLoc = l2g(oldLoc);

        // Change the pan settings to keep the zoomLocation in the same exact location before and after the zoom.
        const diff = newLoc.subtract(data.zoomLocation);
        this.panX += diff.x;
        this.panY += diff.y;

        layerManager.invalidate();
        sendClientOptions();
    }

    @Mutation
    setGridColour(data: { colour: string; sync: boolean }) {
        this.gridColour = data.colour;
        layerManager.getGridLayer()!.drawGrid();
        if (data.sync) socket.emit("Client.Options.Set", { gridColour: data.colour });
    }

    @Mutation
    setFOWColour(data: { colour: string; sync: boolean }) {
        this.fowColour = data.colour;
        layerManager.invalidate();
        if (data.sync) socket.emit("Client.Options.Set", { fowColour: data.colour });
    }

    @Mutation
    setRulerColour(data: { colour: string; sync: boolean }) {
        this.rulerColour = data.colour;
        if (data.sync) socket.emit("Client.Options.Set", { rulerColour: data.colour });
    }

    @Mutation
    setPanX(x: number) {
        this.panX = x;
    }

    @Mutation
    setPanY(y: number) {
        this.panY = y;
    }

    @Mutation
    setZoomFactor(zoomFactor: number) {
        this.zoomFactor = zoomFactor;
    }

    @Mutation
    increasePanX(increase: number) {
        this.panX += increase;
    }

    @Mutation
    increasePanY(increase: number) {
        this.panY += increase;
    }

    @Mutation
    setUnitSize(data: { unitSize: number; sync: boolean }) {
        if (this.unitSize !== data.unitSize && data.unitSize > 0 && data.unitSize < Infinity) {
            this.unitSize = data.unitSize;
            layerManager.invalidate();
            if (data.sync) socket.emit("Location.Options.Set", { unit_size: data.unitSize });
        }
    }

    @Mutation
    setUseGrid(data: { useGrid: boolean; sync: boolean }) {
        if (this.useGrid !== data.useGrid) {
            this.useGrid = data.useGrid;
            const gridLayer = layerManager.getGridLayer()!;
            if (data.useGrid) gridLayer.canvas.style.display = "block";
            else gridLayer.canvas.style.display = "none";
            if (data.sync) socket.emit("Location.Options.Set", { use_grid: data.useGrid });
        }
    }

    @Mutation
    setGridSize(data: { gridSize: number; sync: boolean }): void {
        if (this.gridSize !== data.gridSize && data.gridSize > 0) {
            this.gridSize = data.gridSize;
            const gridLayer = layerManager.getGridLayer();
            if (gridLayer !== undefined) gridLayer.drawGrid();
            if (data.sync) socket.emit("Gridsize.Set", data.gridSize);
        }
    }

    @Mutation
    setFullFOW(data: { fullFOW: boolean; sync: boolean }) {
        if (this.fullFOW !== data.fullFOW) {
            this.fullFOW = data.fullFOW;
            layerManager.invalidateLight();
            if (data.sync) socket.emit("Location.Options.Set", { full_fow: data.fullFOW });
        }
    }

    @Mutation
    setFOWOpacity(data: { fowOpacity: number; sync: boolean }) {
        this.fowOpacity = data.fowOpacity;
        layerManager.invalidateLight();
        if (data.sync) socket.emit("Location.Options.Set", { fow_opacity: data.fowOpacity });
    }

    @Mutation
    setLineOfSight(data: { fowLOS: boolean; sync: boolean }) {
        if (this.fowLOS !== data.fowLOS) {
            this.fowLOS = data.fowLOS;
            layerManager.invalidate();
            if (data.sync) socket.emit("Location.Options.Set", { fow_los: data.fowLOS });
        }
    }

    @Mutation
    setLocationName(name: string) {
        this.locationName = name;
    }

    @Mutation
    updateNote(data: { note: Note; sync: boolean }) {
        const actualNote = this.notes.find(n => n.uuid === data.note.uuid);
        if (actualNote === undefined) return;
        actualNote.title = data.note.title;
        actualNote.text = data.note.text;
        if (data.sync) socket.emit("Note.Update", actualNote);
    }

    @Mutation
    removeNote(data: { note: Note; sync: boolean }) {
        this.notes = this.notes.filter(n => n.uuid !== data.note.uuid);
        if (data.sync) socket.emit("Note.Remove", data.note.uuid);
    }

    @Action
    clear() {
        (<any>this.context.state).visionSources = [];
        (<any>this.context.state).visionBlockers = [];
        (<any>this.context.state).ownedtokens = [];
        (<any>this.context.state).annotations = [];
        (<any>this.context.state).movementblockers = [];
        this.context.commit("recalculateBV");
    }
}

export const gameStore = getModule(GameStore);

// import Vuex from "vuex";
import { Action, getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";

import socket from "@/game/api/socket";
import BoundingVolume from "@/game/bvh/bvh";
import layerManager from "@/game/layers/manager";
import store from "@/store";

import { AssetList } from "@/core/comm/types";
import { sendClientOptions } from "@/game/api/utils";
import { Note } from "@/game/comm/types/general";
import { GlobalPoint } from "@/game/geom";
import { g2l, l2g } from "@/game/units";

export interface GameState {
    boardInitialized: boolean;
}

@Module({ dynamic: true, store, name: "game", namespaced: true })
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

    BV = new BoundingVolume([]);

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
    selectLayer(name: string, sync: boolean) {
        const index = this.layers.indexOf(name);
        if (index >= 0) this.selectedLayerIndex = index;
        if (sync) socket.emit("Client.ActiveLayer.Set", name);
    }

    @Mutation
    newNote(note: Note, sync: boolean) {
        this.notes.push(note);
        if (sync) socket.emit("Note.New", note);
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
    recalculateBV() {
        if (this.boardInitialized) this.BV = new BoundingVolume(this.visionBlockers);
    }

    @Mutation
    updateZoom(newZoomValue: number, zoomLocation: GlobalPoint) {
        if (newZoomValue === this.zoomFactor) return;
        if (newZoomValue < 0.1) newZoomValue = 0.1;
        if (newZoomValue > 5) newZoomValue = 5;

        const oldLoc = g2l(zoomLocation);

        this.zoomFactor = newZoomValue;

        const newLoc = l2g(oldLoc);

        // Change the pan settings to keep the zoomLocation in the same exact location before and after the zoom.
        const diff = newLoc.subtract(zoomLocation);
        this.panX += diff.x;
        this.panY += diff.y;

        layerManager.invalidate();
        sendClientOptions();
    }

    @Mutation
    setGridColour(colour: string, sync: boolean) {
        this.gridColour = colour;
        layerManager.getGridLayer()!.drawGrid();
        if (sync) socket.emit("Client.Options.Set", { gridColour: colour });
    }

    @Mutation
    setFOWColour(colour: string, sync: boolean) {
        this.fowColour = colour;
        layerManager.invalidate();
        if (sync) socket.emit("Client.Options.Set", { fowColour: colour });
    }

    @Mutation
    setRulerColour(colour: string, sync: boolean) {
        this.rulerColour = colour;
        if (sync) socket.emit("Client.Options.Set", { rulerColour: colour });
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
    setUnitSize(unitSize: number, sync: boolean) {
        if (this.unitSize !== unitSize) {
            this.unitSize = unitSize;
            if (layerManager.getGridLayer() !== undefined) layerManager.getGridLayer()!.drawGrid();
            if (sync) socket.emit("Location.Options.Set", { unit_size: unitSize });
        }
    }

    @Mutation
    setUseGrid(useGrid: boolean, sync: boolean) {
        if (this.useGrid !== useGrid) {
            this.useGrid = useGrid;
            const gridLayer = layerManager.getGridLayer()!;
            if (useGrid) gridLayer.canvas.style.display = "block";
            else gridLayer.canvas.style.display = "none";
            if (sync) socket.emit("Location.Options.Set", { use_grid: useGrid });
        }
    }

    @Mutation
    setGridSize(gridSize: number, sync: boolean): void {
        if (this.gridSize !== gridSize && gridSize > 0) {
            this.gridSize = gridSize;
            const gridLayer = layerManager.getGridLayer();
            if (gridLayer !== undefined) gridLayer.drawGrid();
            if (sync) socket.emit("Gridsize.Set", gridSize);
        }
    }

    @Mutation
    setFullFOW(fullFOW: boolean, sync: boolean) {
        if (this.fullFOW !== fullFOW) {
            this.fullFOW = fullFOW;
            layerManager.invalidateLight();
            if (sync) socket.emit("Location.Options.Set", { full_fow: fullFOW });
        }
    }

    @Mutation
    setFOWOpacity(fowOpacity: number, sync: boolean) {
        this.fowOpacity = fowOpacity;
        layerManager.invalidateLight();
        if (sync) socket.emit("Location.Options.Set", { fow_opacity: fowOpacity });
    }

    @Mutation
    setLineOfSight(fowLOS: boolean, sync: boolean) {
        if (this.fowLOS !== fowLOS) {
            this.fowLOS = fowLOS;
            layerManager.invalidate();
            if (sync) socket.emit("Location.Options.Set", { fow_los: fowLOS });
        }
    }

    @Mutation
    setLocationName(name: string) {
        this.locationName = name;
    }

    @Mutation
    updateNote(note: Note, sync: boolean) {
        const actualNote = this.notes.find(n => n.uuid === note.uuid);
        if (actualNote === undefined) return;
        actualNote.title = note.title;
        actualNote.text = note.text;
        if (sync) socket.emit("Note.Update", actualNote);
    }

    @Mutation
    removeNote(note: Note, sync: boolean) {
        this.notes = this.notes.filter(n => n.uuid !== note.uuid);
        if (sync) socket.emit("Note.Remove", note.uuid);
    }

    @Action
    clear() {
        this.context.getters.visionSources = [];
        this.context.getters.visionBlockers = [];
        this.context.getters.ownedtokens = [];
        this.context.getters.annotations = [];
        this.context.getters.movementblockers = [];
        this.context.commit("recalculateBV");
    }
}

export default getModule(GameStore);

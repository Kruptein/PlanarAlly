import Vue from "vue";
import { rootStore } from "@/store";
import { getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";

import { AssetList } from "@/core/comm/types";
import { socket } from "@/game/api/socket";
import { sendClientOptions } from "@/game/api/utils";
import { Note } from "@/game/comm/types/general";
import { ServerShape } from "@/game/comm/types/shapes";
import { GlobalPoint, Vector } from "@/game/geom";
import { layerManager } from "@/game/layers/manager";
import { g2l, l2g } from "@/game/units";
import { zoomValue } from "@/game/utils";
import { Layer } from "./layers/layer";

export interface LocationOptions {
    panX: number;
    panY: number;
    zoomFactor: number;
}

export interface GameState {
    boardInitialized: boolean;
}

@Module({ dynamic: true, store: rootStore, name: "game", namespaced: true })
class GameStore extends VuexModule implements GameState {
    // This is a limited view of selectable layers that is used to generate the layer selection UI and ability to switch layers
    // See the layerManager for proper layer management tools
    layers: string[] = [];
    selectedLayerIndex = -1;
    boardInitialized = false;

    locations: string[] = [];
    floors: string[] = [];
    selectedFloorIndex = -1;

    assets: AssetList = {};

    notes: Note[] = [];

    IS_DM = false;
    FAKE_PLAYER = false;
    isLocked = false;
    gridSize = 50;
    username = "";
    roomName = "";
    roomCreator = "";
    invitationCode = "";
    players: { id: number; name: string }[] = [];

    gridColour = "rgba(0, 0, 0, 1)";
    fowColour = "rgba(0, 0, 0, 1)";
    rulerColour = "rgba(255, 0, 0, 1)";
    panX = 0;
    panY = 0;

    zoomDisplay = 0.5;
    // zoomFactor = 1;

    unitSize = 5;
    unitSizeUnit = "ft";
    useGrid = true;
    fullFOW = false;
    fowOpacity = 0.3;
    fowLOS = false;
    locationName = "";

    annotations: string[] = [];
    ownedtokens: string[] = [];
    _activeTokens: string[] = [];

    drawTEContour = false;
    visionRangeMin = 1640;
    visionRangeMax = 3281;

    clipboard: ServerShape[] = [];
    clipboardPosition: GlobalPoint = new GlobalPoint(0, 0);

    // Maps are not yet supported in Vue untill 3.X, so for now we're using a plain old object
    labels: { [uuid: string]: Label } = {};

    filterNoLabel = false;
    labelFilters: string[] = [];

    showUI = true;

    selectionHelperID: string | null = null;

    get selectedLayer(): string {
        return this.layers[this.selectedLayerIndex];
    }

    get zoomFactor(): number {
        return zoomValue(this.zoomDisplay);
    }

    get locationOptions(): LocationOptions {
        return {
            panX: gameStore.panX,
            panY: gameStore.panY,
            zoomFactor: gameStore.zoomFactor,
        };
    }

    get activeTokens(): string[] {
        if (this._activeTokens.length === 0) return this.ownedtokens;
        return this._activeTokens;
    }

    get screenTopLeft(): GlobalPoint {
        return new GlobalPoint(-this.panX, -this.panY);
    }

    get screenCenter(): GlobalPoint {
        const halfScreen = new Vector(window.innerWidth / 2, window.innerHeight / 2);
        return l2g(g2l(this.screenTopLeft).add(halfScreen));
    }

    @Mutation
    setSelectionHelperId(id: string): void {
        this.selectionHelperID = id;
    }

    @Mutation
    setFakePlayer(value: boolean): void {
        this.FAKE_PLAYER = value;
        this.IS_DM = !value;
        layerManager.invalidateAllFloors();
    }

    @Mutation
    setZoomDisplay(zoom: number): void {
        if (zoom === this.zoomDisplay) return;
        if (zoom < 0) zoom = 0;
        if (zoom > 1) zoom = 1;
        this.zoomDisplay = zoom;
        layerManager.invalidateAllFloors();
    }

    @Mutation
    setBoardInitialized(boardInitialized: boolean): void {
        this.boardInitialized = boardInitialized;
    }

    @Mutation
    toggleUnlabeledFilter(): void {
        this.filterNoLabel = !this.filterNoLabel;
    }

    @Mutation
    addLabel(label: Label): void {
        Vue.set(this.labels, label.uuid, label);
    }

    @Mutation
    setLabelFilters(filters: string[]): void {
        this.labelFilters = filters;
    }

    @Mutation
    setLabelVisibility(data: { user: string; uuid: string; visible: boolean }): void {
        if (!(data.uuid in this.labels)) return;
        this.labels[data.uuid].visible = data.visible;
    }

    @Mutation
    deleteLabel(data: { uuid: string; user: string }): void {
        if (!(data.uuid in this.labels)) return;
        const label = this.labels[data.uuid];
        for (const shape of layerManager.UUIDMap.values()) {
            const i = shape.labels.indexOf(label);
            if (i >= 0) {
                shape.labels.splice(i, 1);
                layerManager.getLayer(shape.floor, shape.layer)!.invalidate(false);
            }
        }
        Vue.delete(this.labels, data.uuid);
    }

    @Mutation
    setDM(isDM: boolean): void {
        this.IS_DM = isDM;
    }

    @Mutation
    setUsername(username: string): void {
        this.username = username;
    }

    @Mutation
    setRoomName(name: string): void {
        this.roomName = name;
    }

    @Mutation
    setRoomCreator(name: string): void {
        this.roomCreator = name;
    }

    @Mutation
    setInvitationCode(code: string): void {
        this.invitationCode = code;
    }

    @Mutation
    addLayer(name: string): void {
        this.layers.push(name);
        if (this.selectedLayerIndex === -1) this.selectedLayerIndex = this.layers.indexOf(name);
    }

    @Mutation
    selectLayer(data: { layer: Layer; sync: boolean }): void {
        let index = this.layers.indexOf(data.layer.name);
        if (index < 0) index = 0;
        // else if (index >= this.layers.reduce((acc: number, val: Layer) => val.floor === data.layer.floor))
        this.selectedLayerIndex = index;
        if (data.sync) socket.emit("Client.ActiveLayer.Set", { floor: data.layer.floor, layer: data.layer.name });
    }

    @Mutation
    selectFloor(targetFloorIndex: number): void {
        this.selectedFloorIndex = targetFloorIndex;
        this.layers = layerManager.floor!.layers.reduce(
            (acc: string[], val: Layer) =>
                val.selectable && (val.playerEditable || this.IS_DM) ? [...acc, val.name] : acc,
            [],
        );
        if (this.selectedLayerIndex < 0) this.selectedLayerIndex = 0;

        for (const [f, floor] of layerManager.floors.entries()) {
            for (const layer of floor.layers) {
                if (f > targetFloorIndex) layer.canvas.style.display = "none";
                else layer.canvas.style.removeProperty("display");
            }
        }
        layerManager.selectLayer(layerManager.getLayer(layerManager.floor!.name)!.name, false, false);
        layerManager.invalidateAllFloors();
    }

    @Mutation
    newNote(data: { note: Note; sync: boolean }): void {
        this.notes.push(data.note);
        if (data.sync) socket.emit("Note.New", data.note);
    }

    @Mutation
    setAssets(assets: AssetList): void {
        this.assets = assets;
    }

    @Mutation
    setLocations(locations: string[]): void {
        this.locations = locations;
    }

    @Mutation
    resetLayerInfo(): void {
        this.floors = [];
        this.selectedFloorIndex = -1;
        this.layers = [];
        this.selectedLayerIndex = -1;
    }

    @Mutation
    updateZoom(data: { newZoomDisplay: number; zoomLocation: GlobalPoint }): void {
        if (data.newZoomDisplay === this.zoomDisplay) return;
        if (data.newZoomDisplay < 0) data.newZoomDisplay = 0;
        if (data.newZoomDisplay > 1) data.newZoomDisplay = 1;
        const oldLoc = g2l(data.zoomLocation);
        this.zoomDisplay = data.newZoomDisplay;
        const newLoc = l2g(oldLoc);
        // Change the pan settings to keep the zoomLocation in the same exact location before and after the zoom.
        const diff = newLoc.subtract(data.zoomLocation);
        this.panX += diff.x;
        this.panY += diff.y;
        layerManager.invalidateAllFloors();
        sendClientOptions(gameStore.locationOptions);
    }

    @Mutation
    setGridColour(data: { colour: string; sync: boolean }): void {
        this.gridColour = data.colour;
        for (const floor of layerManager.floors) {
            layerManager.getGridLayer(floor.name)!.invalidate();
        }
        if (data.sync) socket.emit("Client.Options.Set", { gridColour: data.colour });
    }

    @Mutation
    setFOWColour(data: { colour: string; sync: boolean }): void {
        this.fowColour = data.colour;
        layerManager.invalidateAllFloors();
        if (data.sync) socket.emit("Client.Options.Set", { fowColour: data.colour });
    }

    @Mutation
    setRulerColour(data: { colour: string; sync: boolean }): void {
        this.rulerColour = data.colour;
        if (data.sync) socket.emit("Client.Options.Set", { rulerColour: data.colour });
    }

    @Mutation
    setPanX(x: number): void {
        this.panX = x;
    }

    @Mutation
    setPanY(y: number): void {
        this.panY = y;
    }

    @Mutation
    increasePanX(increase: number): void {
        this.panX += increase;
    }

    @Mutation
    increasePanY(increase: number): void {
        this.panY += increase;
    }

    @Mutation
    setUnitSize(data: { unitSize: number; sync: boolean }): void {
        if (this.unitSize !== data.unitSize && data.unitSize > 0 && data.unitSize < Infinity) {
            this.unitSize = data.unitSize;
            layerManager.invalidateAllFloors();
            // eslint-disable-next-line @typescript-eslint/camelcase
            if (data.sync) socket.emit("Location.Options.Set", { unit_size: data.unitSize });
        }
    }

    @Mutation
    setUnitSizeUnit(data: { unitSizeUnit: string; sync: boolean }): void {
        if (this.unitSizeUnit !== data.unitSizeUnit) {
            this.unitSizeUnit = data.unitSizeUnit;
            layerManager.invalidateAllFloors();
            // eslint-disable-next-line @typescript-eslint/camelcase
            if (data.sync) socket.emit("Location.Options.Set", { unit_size_unit: data.unitSizeUnit });
        }
    }

    @Mutation
    setUseGrid(data: { useGrid: boolean; sync: boolean }): void {
        if (this.useGrid !== data.useGrid) {
            this.useGrid = data.useGrid;
            for (const floor of layerManager.floors) {
                const gridLayer = layerManager.getGridLayer(floor.name)!;
                if (data.useGrid) gridLayer.canvas.style.display = "block";
                else gridLayer.canvas.style.display = "none";
                gridLayer.invalidate();
            }
            // eslint-disable-next-line @typescript-eslint/camelcase
            if (data.sync) socket.emit("Location.Options.Set", { use_grid: data.useGrid });
        }
    }

    @Mutation
    setGridSize(data: { gridSize: number; sync: boolean }): void {
        if (this.gridSize !== data.gridSize && data.gridSize > 0) {
            this.gridSize = data.gridSize;
            for (const floor of layerManager.floors) {
                const gridLayer = layerManager.getGridLayer(floor.name);
                if (gridLayer !== undefined) gridLayer.invalidate();
            }
            if (data.sync) socket.emit("Gridsize.Set", data.gridSize);
        }
    }

    @Mutation
    setVisionRangeMin(data: { value: number; sync: boolean }): void {
        this.visionRangeMin = data.value;
        layerManager.invalidateLightAllFloors();
        // eslint-disable-next-line @typescript-eslint/camelcase
        if (data.sync) socket.emit("Location.Options.Set", { vision_min_range: data.value });
    }

    @Mutation
    setVisionRangeMax(data: { value: number; sync: boolean }): void {
        this.visionRangeMax = Math.max(data.value, this.visionRangeMin);
        layerManager.invalidateLightAllFloors();
        // eslint-disable-next-line @typescript-eslint/camelcase
        if (data.sync) socket.emit("Location.Options.Set", { vision_max_range: this.visionRangeMax });
    }

    @Mutation
    setFullFOW(data: { fullFOW: boolean; sync: boolean }): void {
        if (this.fullFOW !== data.fullFOW) {
            this.fullFOW = data.fullFOW;
            layerManager.invalidateLightAllFloors();
            // eslint-disable-next-line @typescript-eslint/camelcase
            if (data.sync) socket.emit("Location.Options.Set", { full_fow: data.fullFOW });
        }
    }

    @Mutation
    setFOWOpacity(data: { fowOpacity: number; sync: boolean }): void {
        this.fowOpacity = data.fowOpacity;
        layerManager.invalidateLightAllFloors();
        // eslint-disable-next-line @typescript-eslint/camelcase
        if (data.sync) socket.emit("Location.Options.Set", { fow_opacity: data.fowOpacity });
    }

    @Mutation
    setLineOfSight(data: { fowLOS: boolean; sync: boolean }): void {
        if (this.fowLOS !== data.fowLOS) {
            this.fowLOS = data.fowLOS;
            layerManager.invalidateAllFloors();
            // eslint-disable-next-line @typescript-eslint/camelcase
            if (data.sync) socket.emit("Location.Options.Set", { fow_los: data.fowLOS });
        }
    }

    @Mutation
    setLocationName(name: string): void {
        this.locationName = name;
    }

    @Mutation
    updateNote(data: { note: Note; sync: boolean }): void {
        const actualNote = this.notes.find(n => n.uuid === data.note.uuid);
        if (actualNote === undefined) return;
        actualNote.title = data.note.title;
        actualNote.text = data.note.text;
        if (data.sync) socket.emit("Note.Update", actualNote);
    }

    @Mutation
    removeNote(data: { note: Note; sync: boolean }): void {
        this.notes = this.notes.filter(n => n.uuid !== data.note.uuid);
        if (data.sync) socket.emit("Note.Remove", data.note.uuid);
    }

    @Mutation
    toggleUI(): void {
        this.showUI = !this.showUI;
    }

    @Mutation
    setClipboard(clipboard: ServerShape[]): void {
        this.clipboard = clipboard;
    }

    @Mutation
    setClipboardPosition(position: GlobalPoint): void {
        this.clipboardPosition = position;
    }

    @Mutation
    setActiveTokens(tokens: string[]): void {
        this._activeTokens = tokens;
        layerManager.invalidateLightAllFloors();
    }

    @Mutation
    addActiveToken(token: string): void {
        this._activeTokens.push(token);
        layerManager.invalidateLightAllFloors();
    }

    @Mutation
    removeActiveToken(token: string): void {
        if (this._activeTokens.length === 0) {
            this._activeTokens = [...this.ownedtokens];
        }
        this._activeTokens.splice(this._activeTokens.indexOf(token), 1);
        layerManager.invalidateLightAllFloors();
    }

    @Mutation
    setPlayers(players: { id: number; name: string }[]): void {
        this.players = players;
    }

    @Mutation
    addPlayer(player: { id: number; name: string }): void {
        this.players.push(player);
    }

    @Mutation
    kickPlayer(playerId: number): void {
        this.players = this.players.filter(p => p.id !== playerId);
    }

    @Mutation
    setIsLocked(data: { isLocked: boolean; sync: boolean }): void {
        this.isLocked = data.isLocked;
        if (data.sync) {
            socket.emit("Room.Info.Set.Locked", this.isLocked);
        }
    }

    @Mutation
    clear(): void {
        this.ownedtokens = [];
        this.annotations = [];
        this.notes = [];
    }
}

export const gameStore = getModule(GameStore);

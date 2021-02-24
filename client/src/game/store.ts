import Vue from "vue";
import { getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";

import { AssetList } from "@/core/models/types";
import { socket } from "@/game/api/socket";
import { GlobalPoint, Vector } from "@/game/geom";
import { layerManager } from "@/game/layers/manager";
import { Note } from "@/game/models/general";
import { ServerShape } from "@/game/models/shapes";
import { g2l, l2g } from "@/game/units";
import { rootStore } from "@/store";

import { toSnakeCase } from "../core/utils";

import { sendClientLocationOptions, sendDefaultClientOptions, sendRoomClientOptions } from "./api/emits/client";
import {
    sendLocationArchive,
    sendLocationOrder,
    sendLocationRemove,
    sendLocationRename,
    sendLocationUnarchive,
} from "./api/emits/location";
import { sendChangePlayerRole } from "./api/emits/players";
import { sendRoomKickPlayer, sendRoomLock } from "./api/emits/room";
import { floorStore } from "./layers/store";
import { gameManager } from "./manager";
import { UserOptions, Location } from "./models/settings";
import { gameSettingsStore } from "./settings";
import { Label } from "./shapes/interfaces";

export const DEFAULT_GRID_SIZE = 50;

export interface Player {
    id: number;
    name: string;
    location: number;
    role: number;
}

export interface GameState extends UserOptions {
    isBoardInitialized: boolean;
    isConnected: boolean;
}

@Module({ dynamic: true, store: rootStore, name: "game", namespaced: true })
class GameStore extends VuexModule implements GameState {
    private boardInitialized = false;
    private connected = false;

    private locations: Location[] = [];

    assets: AssetList = {};

    notes: Note[] = [];

    markers: string[] = [];

    IS_DM = false;
    FAKE_PLAYER = false;
    isLocked = false;
    username = "";
    roomName = "";
    roomCreator = "";
    invitationCode = "";
    publicName = window.location.host;

    players: Player[] = [];

    defaultClientOptions: UserOptions = {
        gridColour: "rgba(0, 0, 0, 1)",
        fowColour: "rgba(0, 0, 0, 1)",
        rulerColour: "rgba(255, 0, 0, 1)",
        invertAlt: false,
        gridSize: DEFAULT_GRID_SIZE,
        disableScrollToZoom: false,
    };

    gridColour = "rgba(0, 0, 0, 1)";
    fowColour = "rgba(0, 0, 0, 1)";
    rulerColour = "rgba(255, 0, 0, 1)";
    invertAlt = false;
    /**
     *  The desired size of a grid cell in pixels
     
     *  !! This variable must only be used for UI purposes !!
     *  For core distance logic use DEFAULT_GRID_SIZE
     *  The zoom code will take care of proper conversions.
     */
    gridSize = DEFAULT_GRID_SIZE;
    disableScrollToZoom = false;

    panX = 0;
    panY = 0;

    zoomDisplay = 0.5;

    annotations: string[] = [];
    private _ownedtokens: string[] = [];
    private _activeTokens: string[] | undefined = undefined;

    drawTEContour = false;

    clipboard: ServerShape[] = [];
    clipboardPosition: GlobalPoint = new GlobalPoint(0, 0);

    // Maps are not yet supported in Vue untill 3.X, so for now we're using a plain old object
    labels: { [uuid: string]: Label } = {};

    filterNoLabel = false;
    labelFilters: string[] = [];

    showUI = true;

    get zoomFactor(): number {
        const gf = gameStore.gridSize / DEFAULT_GRID_SIZE;
        // Powercurve 0.2/3/10
        // Based on https://stackoverflow.com/a/17102320
        const zoomValue = 1 / (-5 / 3 + (28 / 15) * Math.exp(1.83 * this.zoomDisplay));
        return zoomValue * gf;
    }

    get activeTokens(): readonly string[] {
        if (this._activeTokens === undefined) return this.ownedtokens;
        return this._activeTokens;
    }

    get ownedtokens(): readonly string[] {
        return this._ownedtokens;
    }

    get screenTopLeft(): GlobalPoint {
        return new GlobalPoint(-this.panX, -this.panY);
    }

    get screenCenter(): GlobalPoint {
        const halfScreen = new Vector(window.innerWidth / 2, window.innerHeight / 2);
        return l2g(g2l(this.screenTopLeft).add(halfScreen));
    }

    get isBoardInitialized(): boolean {
        return this.boardInitialized;
    }

    get isConnected(): boolean {
        return this.connected;
    }

    get activeLocations(): readonly Location[] {
        return this.locations.filter((l) => !l.archived);
    }

    get archivedLocations(): readonly Location[] {
        return this.locations.filter((l) => l.archived);
    }

    @Mutation
    setConnected(connected: boolean): void {
        this.connected = connected;
    }

    @Mutation
    setFakePlayer(value: boolean): void {
        this.FAKE_PLAYER = value;
        this.IS_DM = !value;
        layerManager.invalidateAllFloors();
    }

    @Mutation
    setPlayerRole(data: { player: number; role: number; sync: boolean }): void {
        const player = this.players.find((p) => p.id === data.player);
        if (player === undefined) return;
        player.role = data.role;
        if (data.sync) sendChangePlayerRole({ player: data.player, role: data.role });
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
                shape.layer.invalidate(false);
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
    setPublicName(name: string): void {
        if (!name.length) return;
        this.publicName = name;
    }

    @Mutation
    newNote(data: { note: Note; sync: boolean }): void {
        this.notes.push(data.note);
        if (data.sync) socket.emit("Note.New", data.note);
    }

    @Mutation
    newMarker(data: { marker: string; sync: boolean }): void {
        const exists = this.markers.some((m) => m === data.marker);
        if (!exists) {
            this.markers.push(data.marker);
            if (data.sync) socket.emit("Marker.New", data.marker);
        }
    }

    @Mutation
    removeMarker(data: { marker: string; sync: boolean }): void {
        if (this.markers.some((m) => m === data.marker)) {
            this.markers = this.markers.filter((m) => m !== data.marker);
            if (data.sync) socket.emit("Marker.Remove", data.marker);
        }
    }

    @Mutation
    jumpToMarker(marker: string): void {
        const shape = layerManager.UUIDMap.get(marker);
        if (shape == undefined) return;
        gameManager.setCenterPosition(shape.center());
        sendClientLocationOptions();
        layerManager.invalidateAllFloors();
    }

    @Mutation
    setAssets(assets: AssetList): void {
        this.assets = assets;
    }

    @Mutation
    setActiveLocations(data: { locations: { id: number; name: string; archived: boolean }[]; sync: boolean }): void {
        const archivedLocations = this.locations.filter((l) => l.archived);
        this.locations = data.locations.concat(archivedLocations);
        if (data.sync) sendLocationOrder(this.locations.map((l) => l.id));
    }

    @Mutation
    setLocations(data: { locations: { id: number; name: string; archived: boolean }[]; sync: boolean }): void {
        this.locations = data.locations;
        if (data.sync) sendLocationOrder(this.locations.map((l) => l.id));
    }

    @Mutation
    removeLocation(data: { id: number; sync: boolean }): void {
        const idx = this.locations.findIndex((l) => l.id === data.id);
        if (idx >= 0) this.locations.splice(idx, 1);
        if (data.sync) sendLocationRemove(data.id);
    }

    @Mutation
    renameLocation(data: { location: number; name: string; sync: boolean }): void {
        const location = this.locations.find((l) => l.id === data.location);
        if (location === undefined) {
            throw new Error("unknown location rename attempt");
        }
        if (gameSettingsStore.activeLocation === data.location) gameSettingsStore.setActiveLocation(data.location);
        location.name = data.name;
        if (data.sync) sendLocationRename({ location: data.location, name: data.name });
    }

    @Mutation
    archiveLocation(data: { id: number; sync: boolean }): void {
        const location = this.locations.find((l) => l.id === data.id);
        if (location === undefined) {
            throw new Error("unknown location rename attempt");
        }
        location.archived = true;
        if (data.sync) sendLocationArchive(data.id);
    }

    @Mutation
    unarchiveLocation(data: { id: number; sync: boolean }): void {
        const location = this.locations.find((l) => l.id === data.id);
        if (location === undefined) {
            throw new Error("unknown location rename attempt");
        }
        location.archived = false;
        if (data.sync) sendLocationUnarchive(data.id);
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
        sendClientLocationOptions();
    }

    @Mutation
    setGridColour(data: { colour: string; sync: boolean }): void {
        this.gridColour = data.colour;
        for (const floor of floorStore.floors) {
            layerManager.getGridLayer(floor)!.invalidate();
        }
        if (data.sync) sendRoomClientOptions({ grid_colour: data.colour });
    }

    @Mutation
    setFOWColour(data: { colour: string; sync: boolean }): void {
        this.fowColour = data.colour;
        layerManager.invalidateAllFloors();
        if (data.sync) sendRoomClientOptions({ fow_colour: data.colour });
    }

    @Mutation
    setRulerColour(data: { colour: string; sync: boolean }): void {
        this.rulerColour = data.colour;
        if (data.sync) sendRoomClientOptions({ ruler_colour: data.colour });
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
    setGridSize(data: { gridSize: number; sync: boolean }): void {
        this.gridSize = data.gridSize;
        layerManager.invalidateAllFloors();
        if (data.sync) sendRoomClientOptions({ grid_size: data.gridSize });
    }

    @Mutation
    updateNote(data: { note: Note; sync: boolean }): void {
        const actualNote = this.notes.find((n) => n.uuid === data.note.uuid);
        if (actualNote === undefined) return;
        actualNote.title = data.note.title;
        actualNote.text = data.note.text;
        if (data.sync) socket.emit("Note.Update", actualNote);
    }

    @Mutation
    removeNote(data: { note: Note; sync: boolean }): void {
        this.notes = this.notes.filter((n) => n.uuid !== data.note.uuid);
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
    setActiveTokens(tokens: string[] | undefined): void {
        this._activeTokens = tokens;
        layerManager.invalidateLightAllFloors();
    }

    @Mutation
    addActiveToken(token: string): void {
        if (this._activeTokens === undefined) return;
        this._activeTokens.push(token);
        if (this._activeTokens.length === this._ownedtokens.length) this._activeTokens = undefined;
        layerManager.invalidateLightAllFloors();
    }

    @Mutation
    removeActiveToken(token: string): void {
        if (this._activeTokens === undefined) {
            this._activeTokens = [...this._ownedtokens];
        }
        this._activeTokens.splice(this._activeTokens.indexOf(token), 1);
        layerManager.invalidateLightAllFloors();
    }

    @Mutation
    addOwnedToken(token: string): void {
        if (!this._ownedtokens.includes(token)) this._ownedtokens.push(token);
    }

    @Mutation
    removeOwnedToken(token: string): void {
        const index = this._ownedtokens.indexOf(token);
        if (index >= 0) this._ownedtokens.splice(index, 1);
    }

    @Mutation
    setPlayers(players: Player[]): void {
        this.players = players;
    }

    @Mutation
    addPlayer(player: Player): void {
        this.players.push(player);
    }

    @Mutation
    updatePlayer(data: { player: string; location: number }): void {
        for (const player of this.players) {
            if (player.name === data.player) {
                player.location = data.location;
            }
        }
    }

    @Mutation
    kickPlayer(playerId: number): void {
        sendRoomKickPlayer(playerId);
        this.players = this.players.filter((p) => p.id !== playerId);
    }

    @Mutation
    setIsLocked(data: { isLocked: boolean; sync: boolean }): void {
        this.isLocked = data.isLocked;
        if (data.sync) {
            sendRoomLock(this.isLocked);
        }
    }

    @Mutation
    setInvertAlt(data: { invertAlt: boolean; sync: boolean }): void {
        this.invertAlt = data.invertAlt;
        if (data.sync) sendRoomClientOptions({ invert_alt: data.invertAlt });
    }

    @Mutation
    setDisableScrollToZoom(data: { disableScrollToZoom: boolean; sync: boolean }): void {
        this.disableScrollToZoom = data.disableScrollToZoom;
        if (data.sync) sendRoomClientOptions({ disable_scroll_to_zoom: data.disableScrollToZoom });
    }

    @Mutation
    setDefaultClientOptions(options: UserOptions): void {
        this.defaultClientOptions = options;
    }

    @Mutation
    setDefaultClientOption<K extends keyof UserOptions>(data: { key: K; value: UserOptions[K]; sync: boolean }): void {
        this.defaultClientOptions[data.key] = data.value;
        if (data.sync) sendDefaultClientOptions({ [toSnakeCase(data.key)]: data.value });
    }

    @Mutation
    clear(): void {
        this._ownedtokens = [];
        this.annotations = [];
        this.notes = [];
        this.markers = [];
        this.boardInitialized = false;
    }
}

export const gameStore = getModule(GameStore);

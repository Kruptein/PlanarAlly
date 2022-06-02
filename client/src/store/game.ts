import type { ComputedRef } from "vue";
import { computed } from "vue";

import { toGP } from "../core/geometry";
import type { GlobalPoint } from "../core/geometry";
import type { AssetListMap } from "../core/models/types";
import { Store } from "../core/store";
import { sendClientLocationOptions } from "../game/api/emits/client";
import { sendLabelAdd, sendLabelDelete, sendLabelFilterAdd, sendLabelFilterDelete } from "../game/api/emits/labels";
import { sendLocationChange } from "../game/api/emits/location";
import { sendMarkerCreate, sendMarkerRemove } from "../game/api/emits/marker";
import { sendNewNote, sendRemoveNote, sendUpdateNote } from "../game/api/emits/note";
import { sendChangePlayerRole } from "../game/api/emits/players";
import { sendRoomKickPlayer, sendRoomLock } from "../game/api/emits/room";
import { showClientRect } from "../game/client";
import { getAllShapes, getGlobalId, getShape } from "../game/id";
import type { LocalId } from "../game/id";
import type { Note } from "../game/models/general";
import type { Player } from "../game/models/player";
import type { ServerShape } from "../game/models/shapes";
import { setCenterPosition } from "../game/position";
import type { Label } from "../game/shapes/interfaces";
import { router } from "../router";

import { coreStore } from "./core";
import { floorStore } from "./floor";

interface GameState {
    isConnected: boolean;
    isDm: boolean;
    isFakePlayer: boolean;
    showUi: boolean;
    boardInitialized: boolean;

    // Player
    players: Player[];

    ownedTokens: Set<LocalId>;
    activeTokenFilters: Set<LocalId> | undefined;

    // Room
    roomName: string;
    roomCreator: string;
    invitationCode: string;
    publicName: string;
    isLocked: boolean;

    assets: AssetListMap;

    annotations: Set<LocalId>;

    markers: Set<LocalId>;

    notes: Note[];

    clipboard: ServerShape[];
    clipboardPosition: GlobalPoint;

    labels: Map<string, Label>;
    filterNoLabel: boolean;
    labelFilters: string[];
}

class GameStore extends Store<GameState> {
    activeTokens: ComputedRef<Set<LocalId>>;

    constructor() {
        super();
        this.activeTokens = computed(() => {
            if (this._state.activeTokenFilters !== undefined) return this._state.activeTokenFilters;
            return this._state.ownedTokens;
        });
    }
    protected data(): GameState {
        return {
            isConnected: false,
            isDm: false,
            isFakePlayer: false,
            showUi: true,
            boardInitialized: false,

            players: [],

            ownedTokens: new Set(),
            activeTokenFilters: undefined,

            roomName: "",
            roomCreator: "",
            invitationCode: "",
            publicName: window.location.host,
            isLocked: false,

            assets: new Map(),

            annotations: new Set(),

            markers: new Set(),

            notes: [],

            clipboard: [],
            clipboardPosition: toGP(0, 0),

            labels: new Map(),
            filterNoLabel: false,
            labelFilters: [],
        };
    }

    clear(): void {
        this._state.activeTokenFilters?.clear();
        this._state.ownedTokens.clear();
        this._state.annotations.clear();
        this._state.notes = [];
        this._state.markers.clear();
        this._state.boardInitialized = false;
    }

    // GENERAL STATE

    setConnected(connected: boolean): void {
        this._state.isConnected = connected;
    }

    setBoardInitialized(initialized: boolean): void {
        this._state.boardInitialized = initialized;
    }

    setDm(isDm: boolean): void {
        this._state.isDm = isDm;
    }

    setFakePlayer(isFakePlayer: boolean): void {
        this._state.isFakePlayer = isFakePlayer;
        this._state.isDm = !isFakePlayer;
        floorStore.invalidateAllFloors();
    }

    toggleUi(): void {
        this._state.showUi = !this._state.showUi;
    }

    // PLAYERS

    setPlayers(players: Player[]): void {
        this._state.players = players;
    }

    addPlayer(player: Player): void {
        this._state.players.push(player);
    }

    updatePlayersLocation(
        players: string[],
        location: number,
        sync: boolean,
        targetPosition?: { x: number; y: number },
    ): void {
        for (const player of this._state.players) {
            if (players.includes(player.name)) {
                player.location = location;
            }
        }
        this._state.players = [...this._state.players];
        if (sync) sendLocationChange({ location, users: players, position: targetPosition });
    }

    kickPlayer(playerId: number): void {
        const player = this._state.players.find((p) => p.id === playerId);
        if (player === undefined) return;

        if (player.name === router.currentRoute.value.params.creator && coreStore.state.username !== player.name) {
            return;
        }

        sendRoomKickPlayer(playerId);
        this._state.players = this._state.players.filter((p) => p.id !== playerId);
    }

    setPlayerRole(playerId: number, role: number, sync: boolean): void {
        const player = this._state.players.find((p) => p.id === playerId);
        if (player === undefined) return;

        if (player.name === router.currentRoute.value.params.creator && coreStore.state.username !== player.name) {
            return;
        }

        player.role = role;
        if (sync) sendChangePlayerRole({ player: playerId, role });
    }

    setShowPlayerRect(playerId: number, showPlayerRect: boolean): void {
        const player = this._state.players.find((p) => p.id === playerId);
        if (player === undefined) return;

        player.showRect = showPlayerRect;
        showClientRect(playerId, showPlayerRect);
    }

    // ROOM

    setRoomName(name: string): void {
        this._state.roomName = name;
    }

    setRoomCreator(creator: string): void {
        this._state.roomCreator = creator;
    }

    setInvitationCode(invitationCode: string): void {
        this._state.invitationCode = invitationCode;
    }

    setPublicName(name: string): void {
        if (!name.length) return;
        this._state.publicName = name;
    }

    setIsLocked(isLocked: boolean, sync: boolean): void {
        this._state.isLocked = isLocked;
        if (sync) sendRoomLock(isLocked);
    }

    // ACCESS

    setActiveTokens(...tokens: LocalId[]): void {
        this._state.activeTokenFilters = new Set(tokens);
        floorStore.invalidateLightAllFloors();
    }

    unsetActiveTokens(): void {
        this._state.activeTokenFilters = undefined;
        floorStore.invalidateLightAllFloors();
    }

    addActiveToken(token: LocalId): void {
        if (this._state.activeTokenFilters === undefined) return;
        this._state.activeTokenFilters.add(token);
        if (this._state.activeTokenFilters.size === this._state.ownedTokens.size)
            this._state.activeTokenFilters = undefined;
        floorStore.invalidateLightAllFloors();
    }

    removeActiveToken(token: LocalId): void {
        if (this._state.activeTokenFilters === undefined) {
            this._state.activeTokenFilters = new Set([...this._state.ownedTokens]);
        }
        this._state.activeTokenFilters.delete(token);
        floorStore.invalidateLightAllFloors();
    }

    addOwnedToken(token: LocalId): void {
        this._state.ownedTokens.add(token);
    }

    removeOwnedToken(token: LocalId): void {
        this._state.ownedTokens.delete(token);
    }

    // ASSETS
    setAssets(assets: AssetListMap): void {
        this._state.assets = assets;
    }

    // ANNOTATIONS
    addAnnotation(shape: LocalId): void {
        this._state.annotations.add(shape);
    }

    removeAnnotation(shape: LocalId): void {
        this._state.annotations.delete(shape);
    }

    // MARKERS

    newMarker(marker: LocalId, sync: boolean): void {
        if (!this._state.markers.has(marker)) {
            this._state.markers.add(marker);
            if (sync) sendMarkerCreate(getGlobalId(marker));
        }
    }

    jumpToMarker(marker: LocalId): void {
        const shape = getShape(marker);
        if (shape == undefined) return;
        setCenterPosition(shape.center());
        sendClientLocationOptions();
        floorStore.invalidateAllFloors();
    }

    removeMarker(marker: LocalId, sync: boolean): void {
        if (this._state.markers.has(marker)) {
            this._state.markers.delete(marker);
            if (sync) sendMarkerRemove(getGlobalId(marker));
        }
    }

    // NOTES
    newNote(note: Note, sync: boolean): void {
        this._state.notes.push(note);
        if (sync) sendNewNote(note);
    }

    updateNote(note: Note, sync: boolean): void {
        const actualNote = this._state.notes.find((n) => n.uuid === note.uuid);
        if (actualNote === undefined) return;
        actualNote.title = note.title;
        actualNote.text = note.text;
        if (sync) sendUpdateNote(note);
    }

    removeNote(note: Note, sync: boolean): void {
        this._state.notes = this._state.notes.filter((n) => n.uuid !== note.uuid);
        if (sync) sendRemoveNote(note.uuid);
    }

    // CLIPBOARD

    setClipboard(clipboard: ServerShape[]): void {
        this._state.clipboard = clipboard;
    }

    setClipboardPosition(position: GlobalPoint): void {
        this._state.clipboardPosition = position;
    }

    // LABELS

    addLabel(label: Label, sync: boolean): void {
        this._state.labels.set(label.uuid, label);
        if (sync) sendLabelAdd(label);
    }

    addLabelFilter(filter: string, sync: boolean): void {
        this._state.labelFilters.push(filter);
        floorStore.invalidateAllFloors();
        if (sync) sendLabelFilterAdd(filter);
    }

    setLabelFilters(filters: string[]): void {
        this._state.labelFilters = filters;
    }

    removeLabelFilter(filter: string, sync: boolean): void {
        const idx = this._state.labelFilters.indexOf(filter);
        if (idx >= 0) {
            this._state.labelFilters.splice(idx, 1);
            floorStore.invalidateAllFloors();

            if (sync) sendLabelFilterDelete(filter);
        }
    }

    setLabelVisibility(uuid: string, visible: boolean): void {
        if (!this._state.labels.has(uuid)) return;
        this._state.labels.get(uuid)!.visible = visible;
    }

    deleteLabel(uuid: string, sync: boolean): void {
        if (!this._state.labels.has(uuid)) return;
        const label = this._state.labels.get(uuid)!;
        for (const shape of getAllShapes()) {
            const i = shape.labels.indexOf(label);
            if (i >= 0) {
                shape.labels.splice(i, 1);
                shape.layer.invalidate(false);
            }
        }
        this._state.labels.delete(uuid);

        if (sync) sendLabelDelete({ uuid });
    }
}

export const gameStore = new GameStore();
(window as any).gameStore = gameStore;

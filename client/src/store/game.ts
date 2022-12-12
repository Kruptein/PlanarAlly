import type { DeepReadonly } from "vue";

import type { GlobalPoint } from "../core/geometry";
import type { AssetListMap } from "../core/models/types";
import { sendLabelAdd, sendLabelDelete, sendLabelFilterAdd, sendLabelFilterDelete } from "../game/api/emits/labels";
import { sendMarkerCreate, sendMarkerRemove } from "../game/api/emits/marker";
import { sendNewNote, sendRemoveNote, sendUpdateNote } from "../game/api/emits/note";
import { sendRoomLock } from "../game/api/emits/room";
import { updateFogColour } from "../game/colour";
import { getAllShapes, getGlobalId, getShape } from "../game/id";
import type { LocalId } from "../game/id";
import type { Label } from "../game/interfaces/label";
import type { Note } from "../game/models/general";
import type { ServerShape } from "../game/models/shapes";
import { setCenterPosition } from "../game/position";
import { floorSystem } from "../game/systems/floors";

import { getGameState, getRawGameState } from "./_game";
import type { GameState } from "./_game";

class GameStore {
    _state: GameState;
    state: DeepReadonly<GameState>;

    constructor() {
        this._state = getRawGameState();
        this.state = getGameState();
    }

    clear(): void {
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
        updateFogColour();
    }

    setFakePlayer(isFakePlayer: boolean): void {
        this._state.isFakePlayer = isFakePlayer;
        this._state.isDm = !isFakePlayer;
        updateFogColour();
        floorSystem.invalidateAllFloors();
    }

    toggleUi(): void {
        this._state.showUi = !this._state.showUi;
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

    // ASSETS
    setAssets(assets: AssetListMap): void {
        this._state.assets = assets;
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
        setCenterPosition(shape.center);
        floorSystem.selectFloor({ name: shape.floor.name }, true);
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
        floorSystem.invalidateAllFloors();
        if (sync) sendLabelFilterAdd(filter);
    }

    setLabelFilters(filters: string[]): void {
        this._state.labelFilters = filters;
    }

    removeLabelFilter(filter: string, sync: boolean): void {
        const idx = this._state.labelFilters.indexOf(filter);
        if (idx >= 0) {
            this._state.labelFilters.splice(idx, 1);
            floorSystem.invalidateAllFloors();

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

import { Store } from "../../../core/store";
import { i18n } from "../../../i18n";
import { getGameState } from "../../../store/_game";
import {
    sendInitiativeNewEffect,
    sendInitiativeOptionUpdate,
    sendInitiativeRemove,
    sendInitiativeRemoveEffect,
    sendInitiativeRenameEffect,
    sendInitiativeRoundUpdate,
    sendInitiativeTurnsEffect,
    sendInitiativeTurnUpdate,
    sendInitiativeAdd,
    sendInitiativeSetValue,
    sendInitiativeClear,
    sendInitiativeReorder,
    sendInitiativeSetSort,
    sendInitiativeActive,
} from "../../api/emits/initiative";
import { getGlobalId, getLocalId, getShape } from "../../id";
import type { GlobalId, LocalId } from "../../id";
import { InitiativeSort } from "../../models/initiative";
import type { InitiativeData, InitiativeEffect, InitiativeSettings } from "../../models/initiative";
import { setCenterPosition } from "../../position";
import { accessSystem } from "../../systems/access";
import { accessState } from "../../systems/access/state";
import { floorSystem } from "../../systems/floors";
import { playerSettingsState } from "../../systems/settings/players/state";

let activeTokensBackup: Set<LocalId> | undefined = undefined;

function getDefaultEffect(): InitiativeEffect {
    const name = i18n.global.t("game.ui.initiative.new_effect");
    return { name, turns: "10", highlightsActor: false };
}

interface InitiativeState {
    showInitiative: boolean;
    locationData: InitiativeData[];
    newData: InitiativeData[];

    roundCounter: number;
    turnCounter: number;
    sort: InitiativeSort;

    editLock: GlobalId | undefined;

    isActive: boolean;
}

class InitiativeStore extends Store<InitiativeState> {
    constructor() {
        super();
    }

    protected data(): InitiativeState {
        return {
            showInitiative: false,
            locationData: [],
            newData: [],

            roundCounter: 1,
            turnCounter: 0,
            sort: InitiativeSort.Down,

            editLock: undefined,

            isActive: false,
        };
    }

    clear(): void {
        this._state.locationData = [];
    }

    show(show: boolean): void {
        this._state.showInitiative = show;
    }

    setData(data: InitiativeSettings): void {
        const initiativeData: InitiativeData[] = [];
        for (const d of data.data) {
            const { shape: globalId, ...shapeData } = d;
            const localId = getLocalId(globalId, false);
            initiativeData.push({ ...shapeData, globalId, localId });
        }
        if (this._state.editLock !== undefined) this._state.newData = initiativeData;
        else this._state.locationData = initiativeData;

        this.setActive(data.isActive);
        this.setRoundCounter(data.round, false);
        this.setTurnCounter(data.turn, false);
        this._state.sort = data.sort;
    }

    // Ideally we get rid of this
    _forceUpdate(): void {
        this._state.locationData = [...this._state.locationData];
    }

    // ACTIVE

    setActive(isActive: boolean): void {
        this._state.isActive = isActive;
        if (playerSettingsState.raw.initiativeOpenOnActivate.value) this.show(isActive);
        if (isActive) {
            if (accessState.raw.activeTokenFilters === undefined) activeTokensBackup = undefined;
            else activeTokensBackup = new Set(accessState.raw.activeTokenFilters);
            this.handleCameraLock();
            this.handleVisionLock();
        } else {
            if (activeTokensBackup === undefined) accessSystem.unsetActiveTokens();
            else accessSystem.setActiveTokens(...activeTokensBackup.values());
        }
    }

    toggleActive(): void {
        this.setActive(!this._state.isActive);
        sendInitiativeActive(this._state.isActive);
    }

    // PURE INITIATIVE

    addInitiative(localId: LocalId, initiative: number | undefined, isGroup = false): void {
        const globalId = getGlobalId(localId);
        let actor = this._state.locationData.find((a) => a.globalId === globalId);
        if (actor === undefined) {
            actor = {
                globalId,
                localId,
                effects: [],
                isGroup,
                isVisible: !getGameState().isDm,
                initiative,
            };
            this._state.locationData.push(actor);
        } else {
            actor.initiative = initiative;
        }
        const { globalId: shape, localId: _, ...actorData } = actor;
        sendInitiativeAdd({ ...actorData, shape });
    }

    setInitiative(globalId: GlobalId, value: number, sync: boolean): void {
        const actor = this.getDataSet().find((a) => a.globalId === globalId);
        if (actor === undefined) return;

        actor.initiative = value;
        if (sync) sendInitiativeSetValue({ shape: globalId, value });
    }

    removeInitiative(globalId: GlobalId, sync: boolean): void {
        const data = this.getDataSet();
        const index = data.findIndex((i) => i.globalId === globalId);
        if (index < 0) return;

        data.splice(index, 1);
        if (sync) sendInitiativeRemove(globalId);
        // Remove highlight
        const localId = getLocalId(globalId);
        if (localId === undefined) return;
        const shape = getShape(localId);
        if (shape === undefined) return;
        if (shape.showHighlight) {
            shape.showHighlight = false;
            shape.layer.invalidate(true);
        }
    }

    clearValues(sync: boolean): void {
        for (const data of this._state.locationData) {
            data.initiative = undefined;
        }
        if (sync) sendInitiativeClear();
    }

    changeOrder(globalId: GlobalId, oldIndex: number, newIndex: number): void {
        if (this.getDataSet()[oldIndex].globalId === globalId) {
            sendInitiativeReorder({ shape: globalId, oldIndex, newIndex });
        }
    }

    // TURN / ROUND TRACKING

    setTurnCounter(turn: number, sync: boolean): void {
        if (sync && !getGameState().isDm && !this.owns()) return;
        this._state.turnCounter = turn;

        const actor = this.getDataSet()[this._state.turnCounter];
        if (actor === undefined) return;

        if (actor.effects.length > 0) {
            for (let e = actor.effects.length - 1; e >= 0; e--) {
                const turns = +actor.effects[e].turns;
                if (!isNaN(turns)) {
                    if (turns <= 0) actor.effects.splice(e, 1);
                    else actor.effects[e].turns = (turns - 1).toString();
                }
            }
        }
        this.handleCameraLock();
        this.handleVisionLock();
        if (sync) sendInitiativeTurnUpdate(turn);
    }

    setRoundCounter(round: number, sync: boolean): void {
        if (sync && !getGameState().isDm && !this.owns()) return;
        this._state.roundCounter = round;
        if (sync) {
            sendInitiativeRoundUpdate(round);
            if (this.getDataSet().length > 0) {
                this.setTurnCounter(0, sync);
            }
        }
    }

    nextTurn(): void {
        if (!getGameState().isDm && !this.owns()) return;
        if (this._state.turnCounter === this.getDataSet().length - 1) {
            this.setRoundCounter(this._state.roundCounter + 1, true);
        } else {
            this.setTurnCounter(this._state.turnCounter + 1, true);
        }
    }

    previousTurn(): void {
        if (!getGameState().isDm) return;
        if (this._state.turnCounter === 0) {
            this.setRoundCounter(this._state.roundCounter - 1, true);
            this.setTurnCounter(this.getDataSet().length - 1, true);
        } else {
            this.setTurnCounter(this._state.turnCounter - 1, true);
        }
    }

    changeSort(sort: number, sync: boolean): void {
        this._state.sort = sort;
        if (sync) sendInitiativeSetSort(sort);
    }

    // EFFECTS

    createEffect(globalId: GlobalId, effect: InitiativeEffect | undefined, sync: boolean): void {
        const actor = this.getDataSet().find((i) => i.globalId === globalId);
        if (actor === undefined) return;

        if (effect === undefined) effect = getDefaultEffect();
        actor.effects.push(effect);

        if (sync) sendInitiativeNewEffect({ actor: globalId, effect });
    }

    setEffectName(globalId: GlobalId, index: number, name: string, sync: boolean): void {
        const actor = this.getDataSet().find((i) => i.globalId === globalId);
        if (actor === undefined) return;

        const effect = actor.effects[index];
        if (effect === undefined) return;

        effect.name = name;
        if (sync) sendInitiativeRenameEffect({ shape: globalId, index, name });
    }

    setEffectTurns(globalId: GlobalId, index: number, turns: string, sync: boolean): void {
        const actor = this.getDataSet().find((i) => i.globalId === globalId);
        if (actor === undefined) return;

        const effect = actor.effects[index];
        if (effect === undefined) return;

        effect.turns = turns;
        if (sync) sendInitiativeTurnsEffect({ shape: globalId, index, turns });
    }

    removeEffect(globalId: GlobalId, index: number, sync: boolean): void {
        const actor = this.getDataSet().find((i) => i.globalId === globalId);
        if (actor === undefined) return;

        actor.effects.splice(index, 1);
        if (sync) sendInitiativeRemoveEffect({ shape: globalId, index });
    }

    // Locks

    lock(shape: GlobalId): void {
        this._state.editLock = shape;
        this._state.newData = this._state.locationData.map((d) => ({ ...d, effects: [...d.effects] }));
    }

    unlock(): void {
        this._state.editLock = undefined;
        this._state.locationData = this._state.newData;
    }

    handleCameraLock(): void {
        if (playerSettingsState.raw.initiativeCameraLock.value) {
            const actor = this.getDataSet()[this._state.turnCounter];
            if (actor?.localId === undefined) return;
            if (accessSystem.hasAccessTo(actor.localId, false, { vision: true }) ?? false) {
                const shape = getShape(actor.localId);
                if (shape === undefined) return;
                setCenterPosition(shape.center);
                floorSystem.selectFloor({ name: shape.floor.name }, true);
            }
        }
    }

    handleVisionLock(): void {
        if (this._state.isActive && playerSettingsState.raw.initiativeVisionLock.value) {
            const actor = this.getDataSet()[this._state.turnCounter];
            if (actor?.localId !== undefined && accessState.raw.ownedTokens.has(actor.localId)) {
                accessSystem.setActiveTokens(actor.localId);
            } else {
                accessSystem.unsetActiveTokens();
            }
        }
    }

    // EXTRA

    getDataSet(): InitiativeData[] {
        return this._state[this._state.editLock === undefined ? "locationData" : "newData"];
    }

    owns(globalId?: GlobalId): boolean {
        if (getGameState().isDm) return true;
        if (globalId === undefined) {
            const actor = this._state.locationData[this._state.turnCounter];
            if (actor === undefined) return false;
            globalId = actor.globalId;
        }
        const localId = getLocalId(globalId, false);
        if (localId === undefined) return false;
        return accessSystem.hasAccessTo(localId, false, { edit: true });
    }

    toggleOption(index: number, option: "isVisible" | "isGroup"): void {
        const actor = this.getDataSet()[index];
        if (actor === undefined || !this.owns(actor.globalId)) return;
        actor[option] = !actor[option];
        sendInitiativeOptionUpdate({ shape: actor.globalId, option, value: actor[option] });
    }

    setOption(globalId: GlobalId, option: "isVisible" | "isGroup", value: boolean): void {
        const actor = this.getDataSet().find((i) => i.globalId === globalId);
        if (actor === undefined) return;
        actor[option] = value;
    }
}

export const initiativeStore = new InitiativeStore();
(window as any).initiativeStore = initiativeStore;

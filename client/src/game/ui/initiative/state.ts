import { Store } from "../../../core/store";
import { i18n } from "../../../i18n";
import { clientStore } from "../../../store/client";
import { gameStore } from "../../../store/game";
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
} from "../../api/emits/initiative";
import { getGlobalId, getLocalId, getShape } from "../../id";
import type { LocalId } from "../../id";
import { InitiativeSort } from "../../models/initiative";
import type { InitiativeData, InitiativeEffect, InitiativeSettings } from "../../models/initiative";
import { setCenterPosition } from "../../position";
import { accessSystem } from "../../systems/access";

let activeTokensBackup: Set<LocalId> | undefined = undefined;

function getDefaultEffect(): InitiativeEffect {
    return { name: i18n.global.t("game.ui.initiative.new_effect"), turns: "10", highlightsActor: false };
}

interface InitiativeState {
    showInitiative: boolean;
    locationData: InitiativeData[];
    newData: InitiativeData[];

    roundCounter: number;
    turnCounter: number;
    sort: InitiativeSort;

    editLock: LocalId;
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

            editLock: -1 as LocalId,
        };
    }

    clear(): void {
        this._state.locationData = [];
    }

    show(show: boolean): void {
        this._state.showInitiative = show;
    }

    setData(data: InitiativeSettings): void {
        const initiativeData: InitiativeData<LocalId>[] = [];
        for (const d of data.data) {
            const shape = getLocalId(d.shape);
            if (shape === undefined) continue;
            initiativeData.push({ ...d, shape });
        }
        if (this._state.editLock !== -1) this._state.newData = initiativeData;
        else this._state.locationData = initiativeData;

        this.setRoundCounter(data.round, false);
        this.setTurnCounter(data.turn, false);
        this._state.sort = data.sort;
    }

    // Ideally we get rid of this
    _forceUpdate(): void {
        this._state.locationData = [...this._state.locationData];
    }

    // PURE INITIATIVE

    addInitiative(shape: LocalId, initiative: number | undefined, isGroup = false): void {
        let actor = this._state.locationData.find((a) => a.shape === shape);
        if (actor === undefined) {
            actor = {
                effects: [],
                isGroup,
                isVisible: !gameStore.state.isDm,
                shape,
                initiative,
            };
            this._state.locationData.push(actor);
        } else {
            actor.initiative = initiative;
        }
        sendInitiativeAdd({ ...actor, shape: getGlobalId(actor.shape) });
    }

    setInitiative(shapeId: LocalId, value: number, sync: boolean): void {
        const actor = this.getDataSet().find((a) => a.shape === shapeId);
        if (actor === undefined) return;

        actor.initiative = value;
        if (sync) sendInitiativeSetValue({ shape: getGlobalId(shapeId), value });
    }

    removeInitiative(shapeId: LocalId, sync: boolean): void {
        const data = this.getDataSet();
        const index = data.findIndex((i) => i.shape === shapeId);
        if (index < 0) return;

        data.splice(index, 1);
        if (sync) sendInitiativeRemove(getGlobalId(shapeId));
        // Remove highlight
        const shape = getShape(shapeId);
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

    changeOrder(shape: LocalId, oldIndex: number, newIndex: number): void {
        if (this.getDataSet()[oldIndex].shape === shape) {
            sendInitiativeReorder({ shape: getGlobalId(shape), oldIndex, newIndex });
        }
    }

    // TURN / ROUND TRACKING

    setTurnCounter(turn: number, sync: boolean): void {
        if (sync && !gameStore.state.isDm && !this.owns()) return;
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
        if (sync && !gameStore.state.isDm && !this.owns()) return;
        this._state.roundCounter = round;
        if (sync) {
            sendInitiativeRoundUpdate(round);
            if (this.getDataSet().length > 0) {
                this.setTurnCounter(0, sync);
            }
        }
    }

    nextTurn(): void {
        if (!gameStore.state.isDm && !this.owns()) return;
        if (this._state.turnCounter === this.getDataSet().length - 1) {
            this.setRoundCounter(this._state.roundCounter + 1, true);
        } else {
            this.setTurnCounter(this._state.turnCounter + 1, true);
        }
    }

    previousTurn(): void {
        if (!gameStore.state.isDm) return;
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

    createEffect(shape: LocalId, effect: InitiativeEffect | undefined, sync: boolean): void {
        const actor = this.getDataSet().find((i) => i.shape === shape);
        if (actor === undefined) return;

        if (effect === undefined) effect = getDefaultEffect();
        actor.effects.push(effect);

        if (sync) sendInitiativeNewEffect({ actor: getGlobalId(actor.shape), effect });
    }

    setEffectName(shape: LocalId, index: number, name: string, sync: boolean): void {
        const actor = this.getDataSet().find((i) => i.shape === shape);
        if (actor === undefined) return;

        const effect = actor.effects[index];
        if (effect === undefined) return;

        effect.name = name;
        if (sync) sendInitiativeRenameEffect({ shape: getGlobalId(shape), index, name });
    }

    setEffectTurns(shape: LocalId, index: number, turns: string, sync: boolean): void {
        const actor = this.getDataSet().find((i) => i.shape === shape);
        if (actor === undefined) return;

        const effect = actor.effects[index];
        if (effect === undefined) return;

        effect.turns = turns;
        if (sync) sendInitiativeTurnsEffect({ shape: getGlobalId(shape), index, turns });
    }

    removeEffect(shape: LocalId, index: number, sync: boolean): void {
        const actor = this.getDataSet().find((i) => i.shape === shape);
        if (actor === undefined) return;

        actor.effects.splice(index, 1);
        if (sync) sendInitiativeRemoveEffect({ shape: getGlobalId(shape), index });
    }

    // Locks

    lock(shape: LocalId): void {
        this._state.editLock = shape;
        this._state.newData = this._state.locationData.map((d) => ({ ...d, effects: [...d.effects] }));
    }

    unlock(): void {
        this._state.editLock = -1 as LocalId;
        this._state.locationData = this._state.newData;
    }

    handleCameraLock(): void {
        if (clientStore.state.initiativeCameraLock) {
            const actor = this.getDataSet()[this._state.turnCounter];
            if (accessSystem.hasAccessTo(actor.shape, false, { vision: true }) ?? false) {
                const shape = getShape(actor.shape)!;
                setCenterPosition(shape.center());
            }
        }
    }

    handleVisionLock(): void {
        if (clientStore.state.initiativeVisionLock) {
            const actor = this.getDataSet()[this._state.turnCounter];
            if (gameStore.state.activeTokenFilters === undefined) activeTokensBackup = undefined;
            else activeTokensBackup = new Set(gameStore.state.activeTokenFilters);
            if (gameStore.state.ownedTokens.has(actor.shape)) {
                gameStore.setActiveTokens(actor.shape);
            } else {
                gameStore.unsetActiveTokens();
            }
        } else {
            if (activeTokensBackup === undefined) gameStore.unsetActiveTokens();
            else gameStore.setActiveTokens(...activeTokensBackup.values());
        }
    }

    // EXTRA

    getDataSet(): InitiativeData[] {
        return this._state[this._state.editLock === -1 ? "locationData" : "newData"];
    }

    owns(shapeId?: LocalId): boolean {
        if (gameStore.state.isDm) return true;
        if (shapeId === undefined) {
            shapeId = this._state.locationData[this._state.turnCounter]?.shape;
            if (shapeId === undefined) return false;
        }
        return accessSystem.hasAccessTo(shapeId, false, { edit: true });
    }

    toggleOption(index: number, option: "isVisible" | "isGroup"): void {
        const actor = this.getDataSet()[index];
        if (actor === undefined || !this.owns(actor.shape)) return;
        actor[option] = !actor[option];
        sendInitiativeOptionUpdate({ shape: getGlobalId(actor.shape), option, value: actor[option] });
    }

    setOption(shape: LocalId, option: "isVisible" | "isGroup", value: boolean): void {
        const actor = this.getDataSet().find((i) => i.shape === shape);
        if (actor === undefined) return;
        actor[option] = value;
    }
}

export const initiativeStore = new InitiativeStore();
(window as any).initiativeStore = initiativeStore;

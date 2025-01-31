import type { ApiInitiative } from "../../../apiTypes";
import type { GlobalId, LocalId } from "../../../core/id";
import { Store } from "../../../core/store";
import { i18n } from "../../../i18n";
import {
    sendInitiativeNewEffect,
    sendInitiativeOptionSet,
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
import { InitiativeSort } from "../../models/initiative";
import type { InitiativeData, InitiativeEffect } from "../../models/initiative";
import { setCenterPosition } from "../../position";
import { accessSystem } from "../../systems/access";
import { accessState } from "../../systems/access/state";
import { floorSystem } from "../../systems/floors";
import { gameState } from "../../systems/game/state";
import { playerSettingsState } from "../../systems/settings/players/state";

let activeTokensBackup: Set<LocalId> | undefined = undefined;

function getDefaultEffect(): InitiativeEffect {
    const name = i18n.global.t("game.ui.initiative.new_effect");
    return { name, turns: "10", highlightsActor: false };
}

interface InitiativeState {
    manuallyOpened: boolean;
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
    protected data(): InitiativeState {
        return {
            manuallyOpened: false,
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

    show(show: boolean, manuallyOpened: boolean): void {
        this._state.showInitiative = show;
        this._state.manuallyOpened = manuallyOpened;
    }

    setData(data: ApiInitiative): void {
        const initiativeData: InitiativeData[] = [];
        for (const d of data.data) {
            const { shape: globalId, ...shapeData } = d;
            const localId = getLocalId(globalId, false);
            initiativeData.push({ ...shapeData, globalId, localId });
        }
        if (this._state.editLock !== undefined) this._state.newData = initiativeData;
        else this._state.locationData = initiativeData;

        if (!this._state.manuallyOpened) this.setActive(data.isActive);
        this.setRoundCounter(data.round, false);
        this.setTurnCounter(data.turn, { sync: false, updateEffects: false });
        this._state.sort = data.sort;
    }

    // Ideally we get rid of this
    _forceUpdate(): void {
        this._state.locationData = [...this._state.locationData];
    }

    // ACTIVE

    setActive(isActive: boolean): void {
        this._state.isActive = isActive;
        if (playerSettingsState.raw.initiativeOpenOnActivate.value) this.show(isActive, false);
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

    addInitiative(localId: LocalId, isGroup = false): void {
        const globalId = getGlobalId(localId);
        if (globalId === undefined) {
            console.error("Unknown global id for initiative entry found");
            return;
        }

        let actor = this._state.locationData.find((a) => a.globalId === globalId);
        if (actor === undefined) {
            actor = {
                globalId,
                localId,
                effects: [],
                isGroup,
                isVisible: !gameState.raw.isDm,
                initiative: undefined,
            };
            this._state.locationData.push(actor);
        } else {
            // actor already known.
            return;
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
            shape.layer?.invalidate(true);
        }
    }

    clearValues(sync: boolean): void {
        for (const data of this._state.locationData) {
            data.initiative = undefined;
        }
        if (sync) sendInitiativeClear();
    }

    changeOrder(globalId: GlobalId, oldIndex: number, newIndex: number): void {
        if (this.getDataSet()[oldIndex]?.globalId === globalId) {
            sendInitiativeReorder({ shape: globalId, oldIndex, newIndex });
        }
    }

    // TURN / ROUND TRACKING

    setTurnCounter(turn: number, options: { sync: boolean; updateEffects: boolean }): void {
        if (options.sync && !gameState.raw.isDm && !this.owns()) return;
        this._state.turnCounter = turn;

        if (options.updateEffects) {
            const actor = this.getDataSet()[this._state.turnCounter];
            if (actor === undefined) return;

            if (actor.effects.length > 0) {
                for (let e = actor.effects.length - 1; e >= 0; e--) {
                    const turns = +actor.effects[e]!.turns;
                    if (!isNaN(turns)) {
                        if (turns <= 0) actor.effects.splice(e, 1);
                        else actor.effects[e]!.turns = (turns - 1).toString();
                    }
                }
            }
        }

        this.handleCameraLock();
        this.handleVisionLock();
        if (options.sync) sendInitiativeTurnUpdate(turn);
    }

    setRoundCounter(round: number, sync: boolean): void {
        if (sync && !gameState.raw.isDm && !this.owns()) return;
        this._state.roundCounter = round;
        if (sync) {
            sendInitiativeRoundUpdate(round);
            if (this.getDataSet().length > 0) {
                this.setTurnCounter(0, { sync, updateEffects: true });
            }
        }
    }

    nextTurn(): void {
        if (!gameState.raw.isDm && !this.owns()) return;
        if (this._state.turnCounter === this.getDataSet().length - 1) {
            this.setRoundCounter(this._state.roundCounter + 1, true);
        } else {
            this.setTurnCounter(this._state.turnCounter + 1, { sync: true, updateEffects: true });
        }
    }

    previousTurn(): void {
        if (!gameState.raw.isDm) return;
        if (this._state.turnCounter === 0) {
            this.setRoundCounter(this._state.roundCounter - 1, true);
            this.setTurnCounter(this.getDataSet().length - 1, { sync: true, updateEffects: true });
        } else {
            this.setTurnCounter(this._state.turnCounter - 1, { sync: true, updateEffects: true });
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
        if (this._state.isActive && playerSettingsState.raw.initiativeCameraLock.value) {
            const actor = this.getDataSet()[this._state.turnCounter];
            if (actor?.localId === undefined) return;
            if (accessSystem.hasAccessTo(actor.localId, false, { vision: true })) {
                const shape = getShape(actor.localId);
                if (shape === undefined) return;
                setCenterPosition(shape.center);
                if (shape.floorId !== undefined) floorSystem.selectFloor({ id: shape.floorId }, true);
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

    getActor(): InitiativeData | undefined {
        return this._state.locationData[this._state.turnCounter];
    }

    getDataSet(): InitiativeData[] {
        return this._state[this._state.editLock === undefined ? "locationData" : "newData"];
    }

    owns(globalId?: GlobalId): boolean {
        if (gameState.raw.isDm) return true;
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
        sendInitiativeOptionSet({ shape: actor.globalId, option, value: actor[option] });
    }

    setOption(globalId: GlobalId, option: "isVisible" | "isGroup", value: boolean): void {
        const actor = this.getDataSet().find((i) => i.globalId === globalId);
        if (actor === undefined) return;
        actor[option] = value;
    }
}

export const initiativeStore = new InitiativeStore();
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(window as any).initiativeStore = initiativeStore;

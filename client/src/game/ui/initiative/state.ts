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
    sendInitiativeWipe,
} from "../../api/emits/initiative";
import { getGlobalId, getLocalId, getShape } from "../../id";
import { type InitiativeData, type InitiativeEffect, InitiativeSort } from "../../models/initiative";
import { InitiativeTurnDirection } from "../../models/initiative";
import { setCenterPosition } from "../../position";
import { accessSystem } from "../../systems/access";
import { accessState } from "../../systems/access/state";
import { floorSystem } from "../../systems/floors";
import { gameState } from "../../systems/game/state";
import { playerSettingsState } from "../../systems/settings/players/state";

let activeTokensBackup: Set<LocalId> | undefined = undefined;

function getDefaultEffect(): InitiativeEffect {
    const name = i18n.global.t("game.ui.initiative.new_effect");
    return { name, turns: null, highlightsActor: false };
}

function getDefaultTimedEffect(): InitiativeEffect {
    const name = i18n.global.t("game.ui.initiative.new_effect");
    return { name, turns: "10", highlightsActor: false };
}

function updateActorEffects(turnDelta: number, actor: InitiativeData): void {
    if (actor === undefined) return;

    for (let e = actor.effects.length - 1; e >= 0; e--) {
        if (actor.effects[e]!.turns === null) continue;
        const turns = +actor.effects[e]!.turns!;
        if (isNaN(turns)) continue;
        if (turns <= 0) actor.effects.splice(e, 1);
        else actor.effects[e]!.turns = (turns - turnDelta).toString();
    }
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
        this.setRoundCounter(data.round, InitiativeTurnDirection.Null, { sync: false, updateEffects: false });
        this.setTurnCounter(data.turn, InitiativeTurnDirection.Null, { sync: false, updateEffects: false });
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
            else activeTokensBackup = new Set(accessState.raw.activeTokenFilters.get("vision") ?? []);
            this.handleCameraLock();
            this.handleVisionLock();
        } else {
            if (activeTokensBackup === undefined) accessSystem.clearActiveVisionTokens();
            else accessSystem.setActiveVisionTokens(...activeTokensBackup.values());
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

    clearEntries(sync: boolean): void {
        const data = this.getDataSet();
        const len = data.length;
        for (let i = 0; i < len; i++) {
            const entry = data[0];
            if (!entry) continue;
            this.removeInitiative(entry.globalId, false);
        }
        if (sync) sendInitiativeWipe();
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

    setTurnCounter(
        turn: number,
        direction: InitiativeTurnDirection,
        options: { sync: boolean; updateEffects: boolean },
    ): void {
        if (options.sync && !gameState.raw.isDm && !this.owns()) return;

        if (turn < 0) turn = 0;

        if (options.updateEffects) {
            const entry = direction === InitiativeTurnDirection.Forward ? this._state.turnCounter : turn;

            const actor = this.getDataSet()[entry];
            if (actor !== undefined) updateActorEffects(direction, actor);
        }
        this._state.turnCounter = turn;

        this.handleCameraLock();
        this.handleVisionLock();
        if (options.sync) sendInitiativeTurnUpdate({ turn, direction, processEffects: options.updateEffects });
    }

    setRoundCounter(
        round: number,
        direction: InitiativeTurnDirection,
        options: { sync: boolean; updateEffects: boolean },
    ): void {
        if (options.sync && !gameState.raw.isDm && !this.owns()) return;
        this._state.roundCounter = round;
        if (options.updateEffects) {
            for (const actor of this.getDataSet()) {
                updateActorEffects(direction, actor);
            }
        }
        if (options.sync) {
            sendInitiativeRoundUpdate({ round, direction, processEffects: options.updateEffects });
        }
    }

    nextRound(): void {
        this.setRoundCounter(this._state.roundCounter + 1, InitiativeTurnDirection.Forward, {
            sync: true,
            updateEffects: true,
        });
    }

    previousRound(): void {
        this.setRoundCounter(this._state.roundCounter - 1, InitiativeTurnDirection.Backward, {
            sync: true,
            updateEffects: true,
        });
    }

    nextTurn(): void {
        if (!gameState.raw.isDm && !this.owns()) return;
        if (this.getDataSet().length === 0) return;
        if (this._state.turnCounter >= this.getDataSet().length - 1) {
            this.setRoundCounter(this._state.roundCounter + 1, InitiativeTurnDirection.Forward, {
                sync: true,
                updateEffects: false,
            });
            this.setTurnCounter(0, InitiativeTurnDirection.Forward, { sync: true, updateEffects: true });
        } else {
            this.setTurnCounter(this._state.turnCounter + 1, InitiativeTurnDirection.Forward, {
                sync: true,
                updateEffects: true,
            });
        }
    }

    previousTurn(): void {
        if (!gameState.raw.isDm) return;
        if (this._state.turnCounter === 0 && this.getDataSet().length > 0) {
            this.setRoundCounter(this._state.roundCounter - 1, InitiativeTurnDirection.Backward, {
                sync: true,
                updateEffects: false,
            });
            this.setTurnCounter(this.getDataSet().length - 1, InitiativeTurnDirection.Backward, {
                sync: true,
                updateEffects: true,
            });
        } else if (this._state.turnCounter > 0) {
            this.setTurnCounter(this._state.turnCounter - 1, InitiativeTurnDirection.Backward, {
                sync: true,
                updateEffects: true,
            });
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

    createTimedEffect(globalId: GlobalId, effect: InitiativeEffect | undefined, sync: boolean): void {
        this.createEffect(globalId, effect ?? getDefaultTimedEffect(), sync);
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
            if (accessSystem.hasAccessTo(actor.localId, "vision")) {
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
            if (actor?.localId !== undefined && accessSystem.hasAccessTo(actor.localId, "vision")) {
                accessSystem.setActiveVisionTokens(actor.localId);
            } else {
                accessSystem.clearActiveVisionTokens();
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
        return accessSystem.hasAccessTo(localId, "edit");
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

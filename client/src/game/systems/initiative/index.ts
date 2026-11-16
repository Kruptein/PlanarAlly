import { watch } from "vue";

import type { ApiInitiative } from "../../../apiTypes";
import type { GlobalId, LocalId } from "../../../core/id";
import { registerSystem } from "../../../core/systems";
import type { System } from "../../../core/systems/models";
import { i18n } from "../../../i18n";
import { getGlobalId, getLocalId, getShape } from "../../id";
import { setCenterPosition } from "../../position";
import { accessSystem } from "../access";
import { accessState } from "../access/state";
import { floorSystem } from "../floors";
import { gameState } from "../game/state";
import { playerSettingsState } from "../settings/players/state";

import {
    sendInitiativeNewEffect,
    sendInitiativeOptionSet,
    sendInitiativeRemove,
    sendInitiativeRemoveEffect,
    sendInitiativeRenameEffect,
    sendInitiativeRoundUpdate,
    sendInitiativeTimingEffect,
    sendInitiativeTurnsEffect,
    sendInitiativeTurnUpdate,
    sendInitiativeAdd,
    sendInitiativeSetValue,
    sendInitiativeClear,
    sendInitiativeReorder,
    sendInitiativeSetSort,
    sendInitiativeActive,
    sendInitiativeWipe,
} from "./emits";
import {
    type InitiativeData,
    type InitiativeEffect,
    type InitiativeSort,
    InitiativeEffectUpdateTiming,
    InitiativeTurnDirection,
} from "./models";
import { initiativeState } from "./state";
import { closeInitiativeDialog, openInitiativeDialog } from "./ui";

const { mutableReactive: $, mutable } = initiativeState;

function getDefaultEffect(): InitiativeEffect {
    const name = i18n.global.t("game.ui.initiative.new_effect");
    return { name, turns: null, highlightsActor: false, updateTiming: InitiativeEffectUpdateTiming.TurnEnd };
}

function getDefaultTimedEffect(): InitiativeEffect {
    const name = i18n.global.t("game.ui.initiative.new_effect");
    return { name, turns: "10", highlightsActor: false, updateTiming: InitiativeEffectUpdateTiming.TurnEnd };
}

function updateActorEffects(turnDelta: number, actor: InitiativeData, timing?: InitiativeEffectUpdateTiming): void {
    if (actor === undefined) return;

    for (let e = actor.effects.length - 1; e >= 0; e--) {
        const effect = actor.effects[e]!;
        if (effect.turns === null) continue;
        if (timing !== undefined && effect.updateTiming !== timing) continue;
        const turns = +effect.turns;
        if (isNaN(turns)) continue;
        if (turns <= 0) actor.effects.splice(e, 1);
        else effect.turns = (turns - turnDelta).toString();
    }
}

class InitiativeSystem implements System {
    // CORE

    clear(): void {
        $.locationData = [];
    }

    setData(data: ApiInitiative): void {
        const initiativeData: InitiativeData[] = [];
        for (const d of data.data) {
            const { shape: globalId, ...shapeData } = d;
            const localId = getLocalId(globalId, false);
            initiativeData.push({ ...shapeData, globalId, localId });
        }
        if ($.editLock !== undefined) $.newData = initiativeData;
        else $.locationData = initiativeData;

        if (!$.manuallyOpened) this.setActive(data.isActive);
        this.setRoundCounter(data.round, InitiativeTurnDirection.Null, {
            sync: false,
            updateEffects: false,
        });
        this.setTurnCounter(data.turn, InitiativeTurnDirection.Null, {
            sync: false,
            updateEffects: false,
        });
        $.sort = data.sort;
    }

    // Ideally we get rid of this
    _forceUpdate(): void {
        $.locationData = [...$.locationData];
    }

    // ACTIVE

    setActive(isActive: boolean): void {
        $.isActive = isActive;
        if (playerSettingsState.raw.initiativeOpenOnActivate.value) {
            if (isActive) openInitiativeDialog(false);
            else closeInitiativeDialog();
        }
        if (isActive) {
            if (accessState.raw.activeTokenFilters === undefined) mutable.activeTokensBackup = undefined;
            else mutable.activeTokensBackup = new Set(accessState.raw.activeTokenFilters.get("vision") ?? []);
            this.handleCameraLock();
            this.handleVisionLock();
        } else if (playerSettingsState.raw.initiativeVisionLock.value) {
            const backup = mutable.activeTokensBackup;
            if (backup === undefined || backup.size === 0) {
                accessSystem.clearActiveVisionTokens();
            } else {
                accessSystem.setActiveVisionTokens(...backup.values());
            }
        }
    }

    toggleActive(): void {
        this.setActive(!$.isActive);
        sendInitiativeActive($.isActive);
    }

    // PURE INITIATIVE

    addInitiative(localId: LocalId, isGroup = false): void {
        const globalId = getGlobalId(localId);
        if (globalId === undefined) {
            console.error("Unknown global id for initiative entry found");
            return;
        }

        let actor = $.locationData.find((a) => a.globalId === globalId);
        if (actor === undefined) {
            actor = {
                globalId,
                localId,
                effects: [],
                isGroup,
                isVisible: !gameState.raw.isDm,
                initiative: undefined,
            };
            $.locationData.push(actor);
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
        if ($.editLock === globalId) this.unlock();
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
        for (const data of $.locationData) {
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
            let entry: number;
            let next: number;
            if (direction === InitiativeTurnDirection.Forward) {
                entry = $.turnCounter;
                next = turn;
            } else {
                entry = turn;
                next = $.turnCounter;
            }

            const actor = this.getDataSet()[entry];
            const nextActor = this.getDataSet()[next];
            if (actor !== undefined) updateActorEffects(direction, actor, InitiativeEffectUpdateTiming.TurnEnd);
            if (nextActor !== undefined)
                updateActorEffects(direction, nextActor, InitiativeEffectUpdateTiming.TurnStart);
        }
        $.turnCounter = turn;

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
        $.roundCounter = round;
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
        this.setRoundCounter($.roundCounter + 1, InitiativeTurnDirection.Forward, {
            sync: true,
            updateEffects: true,
        });
    }

    previousRound(): void {
        this.setRoundCounter($.roundCounter - 1, InitiativeTurnDirection.Backward, {
            sync: true,
            updateEffects: true,
        });
    }

    nextTurn(): void {
        if (!gameState.raw.isDm && !this.owns()) return;
        if (this.getDataSet().length === 0) return;
        if ($.turnCounter >= this.getDataSet().length - 1) {
            this.setRoundCounter($.roundCounter + 1, InitiativeTurnDirection.Forward, {
                sync: true,
                updateEffects: false,
            });
            this.setTurnCounter(0, InitiativeTurnDirection.Forward, { sync: true, updateEffects: true });
        } else {
            this.setTurnCounter($.turnCounter + 1, InitiativeTurnDirection.Forward, {
                sync: true,
                updateEffects: true,
            });
        }
    }

    previousTurn(): void {
        if (!gameState.raw.isDm) return;
        if ($.turnCounter === 0 && this.getDataSet().length > 0) {
            this.setRoundCounter($.roundCounter - 1, InitiativeTurnDirection.Backward, {
                sync: true,
                updateEffects: false,
            });
            this.setTurnCounter(this.getDataSet().length - 1, InitiativeTurnDirection.Backward, {
                sync: true,
                updateEffects: true,
            });
        } else if ($.turnCounter > 0) {
            this.setTurnCounter($.turnCounter - 1, InitiativeTurnDirection.Backward, {
                sync: true,
                updateEffects: true,
            });
        }
    }

    changeSort(sort: InitiativeSort, sync: boolean): void {
        $.sort = sort;
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

    setEffectUpdateTiming(
        globalId: GlobalId,
        index: number,
        timing: InitiativeEffectUpdateTiming,
        sync: boolean,
    ): void {
        const actor = this.getDataSet().find((i) => i.globalId === globalId);
        if (actor === undefined) return;

        const effect = actor.effects[index];
        if (effect === undefined) return;

        effect.updateTiming = timing;
        if (sync) sendInitiativeTimingEffect({ shape: globalId, index, timing });
    }

    removeEffect(globalId: GlobalId, index: number, sync: boolean): void {
        const actor = this.getDataSet().find((i) => i.globalId === globalId);
        if (actor === undefined) return;

        actor.effects.splice(index, 1);
        if (sync) sendInitiativeRemoveEffect({ shape: globalId, index });
    }

    // LOCKS

    lock(shape: GlobalId): void {
        $.editLock = shape;
        $.newData = $.locationData.map((d) => ({ ...d, effects: [...d.effects] }));
    }

    unlock(): void {
        $.editLock = undefined;
        $.locationData = $.newData;
    }

    handleCameraLock(): void {
        if ($.isActive && playerSettingsState.raw.initiativeCameraLock.value) {
            const actor = this.getDataSet()[$.turnCounter];
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
        if ($.isActive && playerSettingsState.raw.initiativeVisionLock.value) {
            const actor = this.getDataSet()[$.turnCounter];
            if (actor?.localId !== undefined && accessSystem.hasAccessTo(actor.localId, "vision")) {
                accessSystem.setActiveVisionTokens(actor.localId);
            } else {
                accessSystem.clearActiveVisionTokens();
            }
        }
    }

    // EXTRA

    getActor(): InitiativeData | undefined {
        return $.locationData[$.turnCounter];
    }

    getDataSet(): InitiativeData[] {
        return $[$.editLock === undefined ? "locationData" : "newData"];
    }

    owns(globalId?: GlobalId): boolean {
        if (gameState.raw.isDm) return true;
        if (globalId === undefined) {
            const actor = $.locationData[$.turnCounter];
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

export const initiativeSystem = new InitiativeSystem();
registerSystem("initiative", initiativeSystem, false, initiativeState);

// Access checks read the non-reactive owned tokens, so the UI has to be refreshed explicitly when ownership changes
watch(
    () => accessState.reactive.ownedTokens,
    () => initiativeSystem._forceUpdate(),
    { deep: true },
);

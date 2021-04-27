import { Store } from "../../../core/store";
import { uuidv4 } from "../../../core/utils";
import { i18n } from "../../../i18n";
import { gameStore } from "../../../store/game";
import { UuidMap } from "../../../store/shapeMap";
import {
    sendInitiativeNewEffect,
    sendInitiativeRemove,
    sendInitiativeRemoveEffect,
    sendInitiativeRoundUpdate,
    sendInitiativeTurnUpdate,
    sendInitiativeUpdate,
    sendInitiativeUpdateEffect,
} from "../../api/emits/initiative";
import { InitiativeData, InitiativeEffect } from "../../models/general";
import { setCenterPosition } from "../../position";

let activeTokensBackup: Set<string> = new Set();

function getDefaultEffect(): { uuid: string; name: string; turns: number } {
    return { uuid: uuidv4(), name: i18n.global.t("game.ui.initiative.initiative.new_effect"), turns: 10 };
}

interface InitiativeState {
    showInitiative: boolean;
    data: InitiativeData[];
    newData: InitiativeData[];

    currentActor: string | null;
    roundCounter: number;

    editLock: boolean;
    cameraLock: boolean;
    visionLock: boolean;
}

class InitiativeStore extends Store<InitiativeState> {
    protected data(): InitiativeState {
        return {
            showInitiative: false,
            data: [],
            newData: [],

            currentActor: null,
            roundCounter: 1,

            editLock: false,
            cameraLock: false,
            visionLock: false,
        };
    }

    show(show: boolean): void {
        this._state.showInitiative = show;
    }

    setData(data: InitiativeData[]): void {
        if (this._state.editLock) this._state.newData = data;
        else this._state.data = data;
    }

    // PURE INITIATIVE

    addInitiative(data: InitiativeData): void {
        const d = this._state.data.findIndex((a) => a.uuid === data.uuid);
        if (d >= 0) return;
        if (data.initiative === undefined) data.initiative = 0;
        sendInitiativeUpdate(data);
    }

    removeInitiative(uuid: string, sync: boolean): void {
        const d = this._state.data.findIndex((a) => a.uuid === uuid);
        if (d < 0) return;

        this._state.data.splice(d, 1);

        if (sync) sendInitiativeRemove(uuid);
        // Remove highlight
        const shape = UuidMap.get(uuid);
        if (shape === undefined) return;
        if (shape.showHighlight) {
            shape.showHighlight = false;
            shape.layer.invalidate(true);
        }
    }

    // TURN / ROUND TRACKING

    setCurrentActor(currentActor: string): void {
        this._state.currentActor = currentActor;
    }

    updateTurn(actorId: string, sync: boolean): void {
        if (sync && !gameStore.state.isDm) return;

        this.setCurrentActor(actorId);

        const actor = this._state.data.find((a) => a.uuid === actorId);
        if (actor === undefined) return;

        if (actor.effects.length > 0) {
            for (let e = actor.effects.length - 1; e >= 0; e--) {
                if (!isNaN(+actor.effects[e].turns)) {
                    if (actor.effects[e].turns <= 0) actor.effects.splice(e, 1);
                    else actor.effects[e].turns--;
                }
            }
        }
        if (this._state.visionLock) {
            this.setVisionLock(this._state.visionLock);
        }
        this.setCameraLock(this._state.cameraLock);

        if (sync) sendInitiativeTurnUpdate(actorId);
    }

    setRoundCounter(round: number, sync: boolean): void {
        if (sync && !gameStore.state.isDm) return;

        this._state.roundCounter = round;
        if (sync) sendInitiativeRoundUpdate(round);

        if (this._state.data.length > 0) {
            this.updateTurn(this._state.data[0].uuid, true);
        }
    }

    nextTurn(): void {
        if (!gameStore.state.isDm) return;

        const next = this._state.data[
            (this._state.data.findIndex((a) => a.uuid === this._state.currentActor) + 1) % this._state.data.length
        ];
        if (this._state.data[0].uuid === next.uuid) this.setRoundCounter(this._state.roundCounter + 1, true);
        else this.updateTurn(next.uuid, true);
    }

    // EFFECTS

    createEffect(actorId: string, effect: InitiativeEffect | undefined, sync: boolean): void {
        const actor = this.getActor(actorId);
        if (actor === undefined) return;

        if (effect === undefined) effect = getDefaultEffect();

        actor.effects.push(effect);
        if (sync) sendInitiativeNewEffect({ actor: actor.uuid, effect });
    }

    setEffectName(actorId: string, effectId: string, name: string, sync: boolean): void {
        const actor = this.getActor(actorId);
        if (actor === undefined) return;

        const effect = actor.effects.find((e) => e.uuid === effectId);
        if (effect === undefined) return;

        effect.name = name;
        if (sync) this.syncEffect(actor, effect);
    }

    setEffectTurns(actorId: string, effectId: string, turns: number, sync: boolean): void {
        const actor = this.getActor(actorId);
        if (actor === undefined) return;

        const effect = actor.effects.find((e) => e.uuid === effectId);
        if (effect === undefined) return;

        effect.turns = turns;
        if (sync) this.syncEffect(actor, effect);
    }

    updateEffect(actorId: string, effect: InitiativeEffect, sync: boolean): void {
        const actor = this.getActor(actorId);
        if (actor === undefined) return;

        const effectIndex = actor.effects.findIndex((e) => e.uuid === effect.uuid);
        if (effectIndex === undefined) return;

        actor.effects[effectIndex] = effect;
        if (sync) this.syncEffect(actor, effect);
    }

    syncEffect(actor: InitiativeData, effect: InitiativeEffect): void {
        if (!this.owns(actor)) return;
        sendInitiativeUpdateEffect({ actor: actor.uuid, effect });
    }

    removeEffect(actorId: string, effect: string, sync: boolean): void {
        const actor = this.getActor(actorId);
        if (actor === undefined) return;

        const effectIndex = actor.effects.findIndex((e) => e.uuid === effect);
        if (effectIndex === undefined) return;

        actor.effects.splice(effectIndex, 1);
        if (sync) sendInitiativeRemoveEffect({ actor: actorId, effect });
    }

    // Locks

    setLock(lock: boolean): void {
        if (lock) this._state.newData = this._state.data;
        else this._state.data = this._state.newData;
        this._state.editLock = lock;
    }

    setCameraLock(hasCameraLock: boolean): void {
        this._state.cameraLock = hasCameraLock;
        if (hasCameraLock && this._state.currentActor !== null) {
            const shape = UuidMap.get(this._state.currentActor);
            if (shape?.ownedBy(false, { visionAccess: true }) ?? false) {
                setCenterPosition(shape!.center());
            }
        }
    }

    setVisionLock(hasVisionLock: boolean): void {
        this._state.visionLock = hasVisionLock;
        if (hasVisionLock) {
            activeTokensBackup = new Set(gameStore.activeTokens.value);
            if (this._state.currentActor !== null && gameStore.state.ownedTokens.has(this._state.currentActor)) {
                gameStore.setActiveTokens(this._state.currentActor);
            } else {
                gameStore.unsetActiveTokens();
            }
        } else {
            gameStore.setActiveTokens(...activeTokensBackup.values());
        }
    }

    // EXTRA

    private getActor(actorId: string): InitiativeData | undefined {
        return this._state.data.find((a) => a.uuid === actorId);
    }

    owns(actor: InitiativeData): boolean {
        if (gameStore.state.isDm) return true;
        const shape = UuidMap.get(actor.uuid);
        // Shapes that are unknown to this client are hidden from this client but owned by other clients
        if (shape === undefined) return false;
        return shape.ownedBy(false, { editAccess: true });
    }

    toggleOption(actorId: string, option: "visible" | "group"): void {
        const actor = this.getActor(actorId);
        if (actor === undefined || !this.owns(actor)) return;
        actor[option] = !actor[option];
        sendInitiativeUpdate(actor);
    }
}

export const initiativeStore = new InitiativeStore();
(window as any).initiativeStore = initiativeStore;

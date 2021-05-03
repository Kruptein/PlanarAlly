import { PromptFunction } from "../../../core/plugins/modals/prompt";
import { Store } from "../../../core/store";
import { i18n } from "../../../i18n";
import { gameStore } from "../../../store/game";
import { UuidMap } from "../../../store/shapeMap";
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
} from "../../api/emits/initiative";
import { InitiativeData, InitiativeEffect } from "../../models/general";
import { setCenterPosition } from "../../position";

let activeTokensBackup: Set<string> = new Set();

function getDefaultEffect(): InitiativeEffect {
    return { name: i18n.global.t("game.ui.initiative.initiative.new_effect"), turns: "10", highlightsActor: false };
}

interface InitiativeState {
    showInitiative: boolean;
    locationData: InitiativeData[];

    roundCounter: number;
    turnCounter: number;

    cameraLock: boolean;
    visionLock: boolean;
}

class InitiativeStore extends Store<InitiativeState> {
    private promptFunction: PromptFunction | undefined;

    constructor() {
        super();
    }

    protected data(): InitiativeState {
        return {
            showInitiative: false,
            locationData: [],

            roundCounter: 1,
            turnCounter: 0,

            cameraLock: false,
            visionLock: false,
        };
    }

    setPromptFunction(promptFunction: PromptFunction): void {
        this.promptFunction = promptFunction;
    }

    clear(): void {
        this._state.locationData = [];
    }

    show(show: boolean): void {
        this._state.showInitiative = show;
    }

    setData(data: { location: number; round: number; turn: number; data: InitiativeData[] }): void {
        this._state.locationData = data.data;
        this.setRoundCounter(data.round, false);
        this.setTurnCounter(data.turn, false);
    }

    // Ideally we get rid of this
    _forceUpdate(): void {
        this._state.locationData = [...this._state.locationData];
    }

    // PURE INITIATIVE

    async handleRequest(): Promise<void> {
        for (const initiative of this._state.locationData) {
            if (gameStore.state.ownedTokens.has(initiative.shape)) {
                const newInitiative = await this.promptFunction!(
                    UuidMap.get(initiative.shape)!.name,
                    "New initiative requested",
                );
                if (newInitiative !== undefined) {
                    const num = Number.parseFloat(newInitiative);
                    if (isNaN(num)) continue;
                    this.addInitiative(initiative.shape, num, initiative.isGroup);
                }
            }
        }
    }

    addInitiative(shape: string, initiative: number | undefined, isGroup = false): void {
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
        sendInitiativeAdd(actor);
    }

    removeInitiative(shapeId: string, sync: boolean): void {
        const index = this._state.locationData.findIndex((i) => i.shape === shapeId);
        if (index < 0) return;

        this._state.locationData.splice(index, 1);
        if (sync) sendInitiativeRemove(shapeId);
        // Remove highlight
        const shape = UuidMap.get(shapeId);
        if (shape === undefined) return;
        if (shape.showHighlight) {
            shape.showHighlight = false;
            shape.layer.invalidate(true);
        }
    }

    // TURN / ROUND TRACKING

    setTurnCounter(turn: number, sync: boolean): void {
        if (sync && !gameStore.state.isDm) return;
        this._state.turnCounter = turn;

        const actor = this._state.locationData[this._state.turnCounter];
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
        if (this._state.visionLock) {
            this.setVisionLock(this._state.visionLock);
        }
        this.setCameraLock(this._state.cameraLock);
        if (sync) sendInitiativeTurnUpdate(turn);
    }

    setRoundCounter(round: number, sync: boolean): void {
        if (sync && !gameStore.state.isDm) return;
        this._state.roundCounter = round;
        if (sync) {
            sendInitiativeRoundUpdate(round);
            if (this._state.locationData.length > 0) {
                this.setTurnCounter(0, sync);
            }
        }
    }

    nextTurn(): void {
        if (!gameStore.state.isDm) return;
        if (this._state.turnCounter === this._state.locationData.length - 1) {
            this.setRoundCounter(this._state.roundCounter + 1, true);
        } else {
            this.setTurnCounter(this._state.turnCounter + 1, true);
        }
    }

    previousTurn(): void {
        if (!gameStore.state.isDm) return;
        if (this._state.turnCounter === 0) {
            this.setRoundCounter(this._state.roundCounter - 1, true);
            this.setTurnCounter(this._state.locationData.length - 1, true);
        } else {
            this.setTurnCounter(this._state.turnCounter - 1, true);
        }
    }

    // EFFECTS

    createEffect(shape: string, effect: InitiativeEffect | undefined, sync: boolean): void {
        const actor = this._state.locationData.find((i) => i.shape === shape);
        if (actor === undefined) return;

        if (effect === undefined) effect = getDefaultEffect();
        actor.effects.push(effect);
        if (sync) sendInitiativeNewEffect({ actor: actor.shape, effect });
    }

    setEffectName(shape: string, index: number, name: string, sync: boolean): void {
        const actor = this._state.locationData.find((i) => i.shape === shape);
        if (actor === undefined) return;

        const effect = actor.effects[index];
        if (effect === undefined) return;

        effect.name = name;
        if (sync) sendInitiativeRenameEffect({ shape, index, name });
    }

    setEffectTurns(shape: string, index: number, turns: string, sync: boolean): void {
        const actor = this._state.locationData.find((i) => i.shape === shape);
        if (actor === undefined) return;

        const effect = actor.effects[index];
        if (effect === undefined) return;

        effect.turns = turns;
        if (sync) sendInitiativeTurnsEffect({ shape, index, turns });
    }

    removeEffect(shape: string, index: number, sync: boolean): void {
        const actor = this._state.locationData.find((i) => i.shape === shape);
        if (actor === undefined) return;

        actor.effects.splice(index, 1);
        if (sync) sendInitiativeRemoveEffect({ shape, index });
    }

    // Locks

    setCameraLock(hasCameraLock: boolean): void {
        this._state.cameraLock = hasCameraLock;
        if (hasCameraLock) {
            const actor = this._state.locationData[this._state.turnCounter];
            const shape = UuidMap.get(actor.shape);
            if (shape?.ownedBy(false, { visionAccess: true }) ?? false) {
                setCenterPosition(shape!.center());
            }
        }
    }

    setVisionLock(hasVisionLock: boolean): void {
        this._state.visionLock = hasVisionLock;
        if (hasVisionLock) {
            const actor = this._state.locationData[this._state.turnCounter];
            activeTokensBackup = new Set(gameStore.activeTokens.value);
            if (gameStore.state.ownedTokens.has(actor.shape)) {
                gameStore.setActiveTokens(actor.shape);
            } else {
                gameStore.unsetActiveTokens();
            }
        } else {
            gameStore.setActiveTokens(...activeTokensBackup.values());
        }
    }

    // EXTRA

    owns(shapeId: string): boolean {
        if (gameStore.state.isDm) return true;
        const shape = UuidMap.get(shapeId);
        // Shapes that are unknown to this client are hidden from this client but owned by other clients
        if (shape === undefined) return false;
        return shape.ownedBy(false, { editAccess: true });
    }

    toggleOption(index: number, option: "isVisible" | "isGroup"): void {
        const actor = this._state.locationData[index];
        if (actor === undefined || !this.owns(actor.shape)) return;
        actor[option] = !actor[option];
        sendInitiativeOptionUpdate({ shape: actor.shape, option, value: actor[option] });
    }

    setOption(shape: string, option: "isVisible" | "isGroup", value: boolean): void {
        const actor = this._state.locationData.find((i) => i.shape === shape);
        if (actor === undefined) return;
        actor[option] = value;
        console.log(this._state.locationData);
    }
}

export const initiativeStore = new InitiativeStore();
(window as any).initiativeStore = initiativeStore;

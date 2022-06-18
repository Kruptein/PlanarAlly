import { reactive, watchEffect } from "vue";
import type { DeepReadonly } from "vue";

import { registerSystem } from "..";
import type { System } from "..";
import { NO_SYNC } from "../../../core/models/types";
import type { Sync } from "../../../core/models/types";
import { activeShapeStore } from "../../../store/activeShape";
import { getGlobalId, getShape } from "../../id";
import type { LocalId } from "../../id";
import { compositeState } from "../../layers/state";
import { visionState } from "../../vision/state";

import { aurasToServer, partialAuraToServer, toUiAuras } from "./conversion";
import { sendShapeCreateAura, sendShapeRemoveAura, sendShapeUpdateAura } from "./emits";
import type { Aura, AuraId, UiAura } from "./models";
import { createEmptyUiAura } from "./utils";

interface AuraState {
    id: LocalId | undefined;
    auras: UiAura[];
    parentId: LocalId | undefined;
    parentAuras: UiAura[];
}

class AuraSystem implements System {
    private data: Map<LocalId, Aura[]> = new Map();

    // REACTIVE STATE

    private _state: AuraState;

    constructor() {
        this._state = reactive({
            id: undefined,
            auras: [],
            parentId: undefined,
            parentAuras: [],
        });
    }

    get state(): DeepReadonly<AuraState> {
        return this._state;
    }

    loadState(id: LocalId): void {
        this._state.id = id;
        const parentId = compositeState.getCompositeParent(id)?.id;
        this._state.parentId = parentId;
        this.updateAuraState();
    }

    dropState(): void {
        this._state.id = undefined;
    }

    updateAuraState(): void {
        const id = this._state.id!;
        const parentId = this._state.parentId;

        const auras = toUiAuras(this.data.get(id) ?? [], id);
        auras.push(createEmptyUiAura(id));
        this._state.auras = auras;
        this._state.parentAuras = parentId === undefined ? [] : toUiAuras(this.data.get(parentId) ?? [], parentId);
    }

    // BEHAVIOUR

    clear(): void {
        this.dropState();
        this.data.clear();
    }

    // Inform the system about the state of a certain LocalId
    inform(id: LocalId, auras: Aura[]): void {
        this.data.set(id, []);
        for (const aura of auras) {
            this.add(id, aura, NO_SYNC);
        }
    }

    drop(id: LocalId): void {
        this.data.delete(id);
        if (this._state.id === id) {
            this.dropState();
        }
    }

    private getOrCreate(id: LocalId): Aura[] {
        let idAuras = this.data.get(id);
        if (idAuras === undefined) {
            this.inform(id, []);
            idAuras = this.data.get(id)!;
        }
        return idAuras;
    }

    get(id: LocalId, auraId: AuraId, includeParent: boolean): DeepReadonly<Aura> | undefined {
        return this.getAll(id, includeParent).find((t) => t.uuid === auraId);
    }

    getAll(id: LocalId, includeParent: boolean): DeepReadonly<Aura[]> {
        const auras: Aura[] = [];
        if (includeParent) {
            const parent = compositeState.getCompositeParent(id);
            if (parent !== undefined) {
                auras.push(...this.getAll(parent.id, false));
            }
        }
        auras.push(...(this.data.get(id) ?? []));
        return auras;
    }

    add(id: LocalId, aura: Aura, syncTo: Sync): void {
        if (syncTo.server) sendShapeCreateAura(aurasToServer(getGlobalId(id), [aura])[0]);

        this.getOrCreate(id).push(aura);

        if (id === this._state.id) this.updateAuraState();

        if (aura.active) {
            const shape = getShape(id);

            if (shape && aura.visionSource) {
                const floor = shape.floor;
                visionState.addVisionSource({ aura: aura.uuid, shape: id }, floor.id);
            }

            shape?.invalidate(false);
        }
    }

    update(id: LocalId, auraId: AuraId, delta: Partial<Aura>, syncTo: Sync): void {
        const aura = this.data.get(id)?.find((t) => t.uuid === auraId);
        if (aura === undefined) return;

        const shape = getShape(id);
        if (shape === undefined) return;

        if (syncTo.server) {
            sendShapeUpdateAura({
                ...partialAuraToServer({
                    ...delta,
                }),
                shape: getGlobalId(id),
                uuid: auraId,
            });
        }

        const oldAuraActive = aura.active;
        const oldAuraVisionSource = aura.visionSource;

        Object.assign(aura, delta);

        if (oldAuraVisionSource && !aura.visionSource && aura.active) {
            visionState.removeVisionSource(shape.floor.id, aura.uuid);
        } else if (!oldAuraVisionSource && aura.visionSource && aura.active) {
            visionState.addVisionSource({ aura: aura.uuid, shape: id }, shape.floor.id);
        } else if (oldAuraActive && !aura.active && aura.visionSource) {
            visionState.removeVisionSource(shape.floor.id, aura.uuid);
        } else if (!oldAuraActive && aura.active && aura.visionSource) {
            visionState.addVisionSource({ aura: aura.uuid, shape: id }, shape.floor.id);
        }

        if (id === this._state.id) this.updateAuraState();

        if (aura.active || oldAuraActive) getShape(id)?.invalidate(false);
    }

    remove(id: LocalId, auraId: AuraId, syncTo: Sync): void {
        if (syncTo.server) sendShapeRemoveAura({ shape: getGlobalId(id), value: auraId });

        const oldAura = this.get(id, auraId, false);

        this.data.set(id, this.data.get(id)?.filter((au) => au.uuid !== auraId) ?? []);

        if (id === this._state.id) this.updateAuraState();

        if (oldAura?.active === true) {
            const shape = getShape(id);
            if (shape && oldAura?.visionSource === true) {
                visionState.removeVisionSource(shape.floor.id, auraId);
            }
            shape?.invalidate(false);
        }
    }
}

export const auraSystem = new AuraSystem();
registerSystem("auras", auraSystem);

// Aura System state is active whenever a shape is selected due to the quick selection info

watchEffect(() => {
    const id = activeShapeStore.state.id;
    if (id) auraSystem.loadState(id);
    else auraSystem.dropState();
});

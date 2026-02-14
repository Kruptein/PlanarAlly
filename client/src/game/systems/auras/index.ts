import { reactive, watchEffect } from "vue";
import type { DeepReadonly } from "vue";

import type { ApiCoreShape } from "../../../apiTypes";
import type { LocalId } from "../../../core/id";
import { NO_SYNC, SERVER_SYNC } from "../../../core/models/types";
import type { Sync } from "../../../core/models/types";
import { registerSystem } from "../../../core/systems";
import type { ShapeSystem, SystemInformMode } from "../../../core/systems/models";
import { getGlobalId, getShape } from "../../id";
import { LayerName } from "../../models/floor";
import { visionState } from "../../vision/state";
import { accessSystem } from "../access";
import { gameState } from "../game/state";
import { selectedState } from "../selected/state";

import { aurasFromServer, aurasToServer, partialAuraToServer, toUiAuras } from "./conversion";
import { sendShapeCreateAura, sendShapeRemoveAura, sendShapeUpdateAura } from "./emits";
import type { Aura, AuraId, UiAura } from "./models";
import { createEmptyUiAura, generateAuraId } from "./utils";

interface AuraState {
    id: LocalId | undefined;
    auras: UiAura[];
}

class AuraSystem implements ShapeSystem<Aura[]> {
    private data = new Map<LocalId, Aura[]>();

    // CORE

    clear(): void {
        this.dropState();
        this.data.clear();
    }

    drop(id: LocalId): void {
        this.data.delete(id);
        if (this._state.id === id) {
            this.dropState();
        }
    }

    importLate(id: LocalId, data: Aura[], mode: SystemInformMode): void {
        if (data.length === 0) return;

        let newData = data;
        if (mode === "duplicate") {
            newData = data.map((a) => ({ ...a, uuid: generateAuraId() }));
        }
        this.data.set(id, []);
        for (const aura of newData) {
            this.add(id, aura, mode === "load" ? NO_SYNC : SERVER_SYNC);
        }
    }

    export(id: LocalId): Aura[] {
        return this.data.get(id) ?? [];
    }

    toServerShape(id: LocalId, shape: ApiCoreShape): void {
        const uuid = getGlobalId(id);
        if (uuid === undefined) return;
        shape.auras = aurasToServer(uuid, this.getAll(id));
    }

    fromServerShape(shape: ApiCoreShape): Aura[] {
        return aurasFromServer(...shape.auras);
    }

    // REACTIVE STATE

    private _state: AuraState;

    constructor() {
        this._state = reactive({
            id: undefined,
            auras: [],
        });
    }

    get state(): DeepReadonly<AuraState> {
        return this._state;
    }

    loadState(id: LocalId): void {
        this._state.id = id;
        this.updateAuraState();
    }

    dropState(): void {
        this._state.id = undefined;
    }

    updateAuraState(): void {
        const id = this._state.id!;

        const auras = toUiAuras(this.data.get(id) ?? [], id);
        auras.push(createEmptyUiAura(id));
        this._state.auras = auras;
    }

    // BEHAVIOUR

    private getOrCreate(id: LocalId): Aura[] {
        let idAuras = this.data.get(id);
        if (idAuras === undefined) {
            idAuras = [];
            this.data.set(id, idAuras);
        }
        return idAuras;
    }

    get(id: LocalId, auraId: AuraId): DeepReadonly<Aura> | undefined {
        return this.getAll(id).find((t) => t.uuid === auraId);
    }

    getAll(id: LocalId): DeepReadonly<Aura[]> {
        if (gameState.raw.isFakePlayer) {
            const shape = getShape(id);
            if (shape === undefined) return [];
            if (shape.layerName === LayerName.Dm) return [];
        }

        const auras = this.data.get(id) ?? [];

        if (!accessSystem.hasAccessTo(id, "vision", true)) return auras.filter((a) => a.visible);

        return auras;
    }

    add(id: LocalId, aura: Aura, syncTo: Sync): void {
        if (syncTo.server) {
            const gId = getGlobalId(id);
            if (gId) sendShapeCreateAura(aurasToServer(gId, [aura])[0]!);
        }

        this.getOrCreate(id).push(aura);

        if (id === this._state.id) this.updateAuraState();

        if (aura.active) {
            const shape = getShape(id);

            if (shape !== undefined) {
                const layer = shape.layer;
                if (layer !== undefined) {
                    layer.updateSectors(id, shape.getAuraAABB());
                }

                if (aura.visionSource) {
                    if (shape.floorId !== undefined)
                        visionState.addVisionSource({ aura: aura.uuid, shape: id }, shape.floorId);
                }

                shape.invalidate(false);
            }
        }
    }

    update(id: LocalId, auraId: AuraId, delta: Partial<Aura>, syncTo: Sync): void {
        const aura = this.data.get(id)?.find((t) => t.uuid === auraId);
        if (aura === undefined) return;

        const shape = getShape(id);
        if (shape === undefined) return;

        if (syncTo.server) {
            const gId = getGlobalId(id);
            if (gId)
                sendShapeUpdateAura({
                    ...partialAuraToServer({
                        ...delta,
                    }),
                    shape: gId,
                    uuid: auraId,
                });
        }

        const oldAuraActive = aura.active;
        const oldAuraVisionSource = aura.visionSource;

        Object.assign(aura, delta);

        const layer = shape.layer;
        if (layer !== undefined) {
            layer.updateSectors(id, shape.getAuraAABB());
        }

        const floorId = shape.floorId;

        if (floorId !== undefined) {
            if (oldAuraVisionSource && !aura.visionSource && aura.active) {
                visionState.removeVisionSource(floorId, aura.uuid);
            } else if (!oldAuraVisionSource && aura.visionSource && aura.active) {
                visionState.addVisionSource({ aura: aura.uuid, shape: id }, floorId);
            } else if (oldAuraActive && !aura.active && aura.visionSource) {
                visionState.removeVisionSource(floorId, aura.uuid);
            } else if (!oldAuraActive && aura.active && aura.visionSource) {
                visionState.addVisionSource({ aura: aura.uuid, shape: id }, floorId);
            }
        }

        if (id === this._state.id) this.updateAuraState();

        if (aura.active || oldAuraActive) getShape(id)?.invalidate(false);
    }

    remove(id: LocalId, auraId: AuraId, syncTo: Sync): void {
        if (syncTo.server) {
            const gId = getGlobalId(id);
            if (gId) sendShapeRemoveAura({ shape: gId, value: auraId });
        }

        const oldAura = this.get(id, auraId);

        this.data.set(id, this.data.get(id)?.filter((au) => au.uuid !== auraId) ?? []);

        const shape = getShape(id);
        const layer = shape?.layer;
        if (shape !== undefined && layer !== undefined) {
            layer.updateSectors(id, shape.getAuraAABB());
        }

        if (id === this._state.id) this.updateAuraState();

        if (oldAura?.active === true) {
            const shape = getShape(id);
            if (shape && oldAura.visionSource) {
                if (shape.floorId !== undefined) visionState.removeVisionSource(shape.floorId, auraId);
            }
            shape?.invalidate(false);
        }
    }
}

export const auraSystem = new AuraSystem();
registerSystem("auras", auraSystem, true);

// Aura System state is active whenever a shape is selected due to the quick selection info

watchEffect(() => {
    const id = selectedState.reactive.focus;
    if (id) {
        auraSystem.loadState(id);
    } else auraSystem.dropState();
});

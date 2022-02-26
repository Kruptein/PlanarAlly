import { reactive } from "vue";
import type { DeepReadonly } from "vue";

import { registerSystem } from "..";
import type { System } from "..";
import { SyncTo } from "../../../core/models/types";
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
        this.data.set(id, auras);
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

    add(id: LocalId, aura: Aura, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendShapeCreateAura(aurasToServer(getGlobalId(id), [aura])[0]);

        this.data.get(id)!.push(aura);

        if (id === this._state.id) this.updateAuraState();

        if (aura.visionSource) {
            const floor = getShape(id)!.floor;
            visionState.addVisionSource({ aura: aura.uuid, shape: id }, floor.id);
        }

        if (aura.active) {
            const shape = getShape(id);
            shape?.invalidate(false);
        }
    }

    update(id: LocalId, auraId: AuraId, delta: Partial<Aura>, syncTo: SyncTo): void {
        const aura = this.data.get(id)?.find((t) => t.uuid === auraId);
        if (aura === undefined) return;

        if (syncTo === SyncTo.SERVER) {
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

        const floor = getShape(id)!.floor;
        if (oldAuraActive) {
            if (!aura.active || (oldAuraVisionSource && !aura.visionSource)) {
                visionState.removeVisionSource(floor.id, aura.uuid);
            } else if (!oldAuraVisionSource && aura.visionSource) {
                visionState.addVisionSource({ aura: aura.uuid, shape: id }, floor.id);
            }
        } else if (!oldAuraActive && aura.active) {
            visionState.addVisionSource({ aura: aura.uuid, shape: id }, floor.id);
        }

        if (id === this._state.id) this.updateAuraState();

        if (aura.active || oldAuraActive) getShape(id)?.invalidate(false);
    }

    remove(id: LocalId, auraId: AuraId, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendShapeRemoveAura({ shape: getGlobalId(id), value: auraId });

        const oldAura = this.get(id, auraId, false);

        this.data.set(id, this.data.get(id)?.filter((au) => au.uuid !== auraId) ?? []);

        if (id === this._state.id) this.updateAuraState();

        const shape = getShape(id)!;
        if (oldAura?.active === true && oldAura?.visionSource === true)
            visionState.removeVisionSource(shape.floor.id, auraId);

        if (oldAura?.active === true) shape.invalidate(false);
    }
}

export const auraSystem = new AuraSystem();
registerSystem("auras", auraSystem);

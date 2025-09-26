import { watch } from "vue";

import type { ApiShapeCustomData, ApiShapeCustomDataIdentifier } from "../../../apiTypes";
import type { LocalId } from "../../../core/id";
import { registerSystem } from "../../../core/systems";
import type { ShapeSystem } from "../../../core/systems";
import type { DistributiveOmit } from "../../../core/types";
import { getGlobalId, getLocalId } from "../../id";
import { selectedState } from "../selected/state";

import {
    getIdentifier,
    sendShapeCustomDataAdd,
    sendShapeCustomDataRemove,
    sendShapeCustomDataUpdate,
    sendShapeCustomDataUpdateName,
    toApiShapeCustomData,
} from "./emits";
import { customDataState } from "./state";
import {
    customDataKindMap,
    type ElementId,
    type CustomDataKindMap,
    ShapeCustomDataPending,
    type UiShapeCustomData,
} from "./types";

const { mutableReactive: $, mutable } = customDataState;

let ID = 0 as ElementId;

class CustomDataSystem implements ShapeSystem {
    loadState(id: LocalId): void {
        $.id = id;
        $.data = mutable.data.get(id) ?? [];
    }

    dropState(): void {
        $.id = undefined;
        $.data = [];
    }

    clear(): void {
        mutable.data.clear();
        this.dropState();
    }

    drop(id: LocalId): void {
        mutable.data.delete(id);
    }

    inform(id: LocalId, data: ApiShapeCustomData[]): void {
        mutable.data.set(
            id,
            data.map((element) => ({ ...element, id: ID++ as ElementId })),
        );
    }

    updateElement(id: LocalId, elementId: ElementId, data: ApiShapeCustomData): void {
        const target = ($.id === id ? $.data : mutable.data.get(id)) ?? [];
        const element = target.find((element) => element.id === elementId);
        if (element === undefined) return;
        Object.assign(element, data);
    }

    setName(id: LocalId, elementId: ElementId, newName: string, sync: boolean): void {
        const target = ($.id === id ? $.data : mutable.data.get(id)) ?? [];
        const element = target.find((element) => element.id === elementId);
        if (element === undefined) return;
        const ogName = element.name;
        element.name = newName;
        if (element.pending === ShapeCustomDataPending.Leaf) {
            delete element.pending;
            sendShapeCustomDataAdd(toApiShapeCustomData(element));
        } else if (sync) {
            sendShapeCustomDataUpdateName([{ ...getIdentifier(element), name: ogName }, newName]);
        }
    }

    updateKind(id: LocalId, elementId: ElementId, newKind: keyof CustomDataKindMap, sync: boolean): void {
        const target = ($.id === id ? $.data : mutable.data.get(id)) ?? [];
        const element = target.find((element) => element.id === elementId);
        if (element === undefined) return;
        element.kind = newKind;
        element.value = customDataKindMap[newKind].defaultValue;
        if (sync) {
            sendShapeCustomDataUpdate(toApiShapeCustomData(element));
        }
    }

    updateValue(id: LocalId, elementId: ElementId, newValue: unknown, sync: boolean): void {
        const target = ($.id === id ? $.data : mutable.data.get(id)) ?? [];
        const element = target.find((element) => element.id === elementId);
        if (element === undefined) return;
        if (typeof newValue !== typeof element.value) {
            console.error(`Value type mismatch: ${typeof newValue} !== ${typeof element.value}`);
            return;
        }
        element.value = newValue as typeof element.value;
        if (sync) {
            sendShapeCustomDataUpdate(toApiShapeCustomData(element));
        }
    }

    setReference(id: LocalId, elementId: ElementId, newReference: string, sync: boolean): void {
        const target = ($.id === id ? $.data : mutable.data.get(id)) ?? [];
        const element = target.find((element) => element.id === elementId);
        if (element === undefined) return;
        element.reference = newReference;
        if (sync) {
            sendShapeCustomDataUpdate(toApiShapeCustomData(element));
        }
    }

    setDescription(id: LocalId, elementId: ElementId, newDescription: string, sync: boolean): void {
        const target = ($.id === id ? $.data : mutable.data.get(id)) ?? [];
        const element = target.find((element) => element.id === elementId);
        if (element === undefined) return;
        element.description = newDescription;
        if (sync) {
            sendShapeCustomDataUpdate(toApiShapeCustomData(element));
        }
    }

    getElementId(element: ApiShapeCustomDataIdentifier): ElementId | undefined {
        const id = getLocalId(element.shapeId);
        if (!id) return;
        return mutable.data
            .get(id)
            ?.find((el) => el.source === element.source && el.prefix === element.prefix && el.name === element.name)
            ?.id;
    }

    addBranch(id: LocalId, prefix: string): void {
        const shapeId = getGlobalId(id);
        if (shapeId === undefined) return;
        const target = ($.id === id ? $.data : mutable.data.get(id)) ?? [];
        target.push({
            shapeId,
            source: "planarally",
            prefix,
            name: "",
            kind: "text",
            value: "",
            id: ID++ as ElementId,
            pending: ShapeCustomDataPending.Branch,
            reference: null,
            description: null,
        });
    }

    addElement(element: DistributiveOmit<UiShapeCustomData, "id">, sync: boolean): void {
        const id = getLocalId(element.shapeId);
        if (!id) return;
        const target = ($.id === id ? $.data : mutable.data.get(id)) ?? [];
        // todo: ensure souce-prefix-name is unique for shape
        const fullElement = { ...element, id: ID++ as ElementId };
        target.push(fullElement);
        if (sync && element.pending === undefined) {
            sendShapeCustomDataAdd(toApiShapeCustomData(fullElement));
        }
    }

    removeElement(id: LocalId, elementId: ElementId, sync: boolean): void {
        const target = ($.id === id ? $.data : mutable.data.get(id)) ?? [];
        const index = target.findIndex((element) => element.id === elementId);
        if (index === -1) return;
        const element = target[index]!;
        target.splice(index, 1);
        if (sync) {
            sendShapeCustomDataRemove(getIdentifier(element));
        }
    }

    removeBranch(id: LocalId, prefix: string): void {
        const target = ($.id === id ? $.data : mutable.data.get(id)) ?? [];
        const filteredElements: UiShapeCustomData[] = [];
        for (const element of target) {
            if (element.prefix !== prefix && !element.prefix.startsWith(`${prefix}/`)) {
                filteredElements.push(element);
            } else {
                sendShapeCustomDataRemove(getIdentifier(element));
            }
        }
        target.splice(0, target.length, ...filteredElements);
    }
}

export const customDataSystem = new CustomDataSystem();
registerSystem("customData", customDataSystem, true, customDataState);

function checkSelected(shapeId: LocalId | undefined): void {
    if (shapeId) customDataSystem.loadState(shapeId);
    else customDataSystem.dropState();
}

watch(() => selectedState.reactive.focus, checkSelected);

import type { ApiCoreShape, ApiShapeCustomData, ApiShapeCustomDataIdentifier } from "../../../apiTypes";
import type { LocalId } from "../../../core/id";
import { filter, map, some } from "../../../core/iter";
import { registerSystem } from "../../../core/systems";
import type { ShapeSystem, SystemInformMode } from "../../../core/systems/models";
import type { DistributiveOmit } from "../../../core/types";
import { getGlobalId, getLocalId } from "../../id";

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
const CLEAR_ALL = Symbol();

class CustomDataSystem implements ShapeSystem<UiShapeCustomData[]> {
    // CORE

    clear(): void {
        mutable.data.clear();
        $.leases.clear();
        $.data.clear();
    }

    drop(id: LocalId): void {
        mutable.data.delete(id);
        this.dropState(id, CLEAR_ALL);
    }

    importLate(id: LocalId, data: UiShapeCustomData[], mode: SystemInformMode): void {
        if (data.length === 0) return;

        if (mode === "load") {
            mutable.data.set(id, data);
        } else {
            const shapeId = getGlobalId(id);
            if (shapeId === undefined) throw new Error(`Shape ${id} not found`);
            for (const element of data) {
                this.addElement(
                    {
                        ...element,
                        shapeId,
                    },
                    true,
                );
            }
        }
    }

    export(id: LocalId): UiShapeCustomData[] {
        return mutable.data.get(id) ?? [];
    }

    toServerShape(id: LocalId, shape: ApiCoreShape): void {
        shape.custom_data = this.export(id).map(({ id: _, ...rest }) => rest);
    }

    fromServerShape(shape: ApiCoreShape): UiShapeCustomData[] {
        return shape.custom_data.map((element) => ({ ...element, id: ID++ as ElementId }));
    }

    // REACTIVE

    loadState(id: LocalId, source: string): void {
        if ($.leases.has(id)) {
            $.leases.get(id)!.add(source);
        } else {
            $.leases.set(id, new Set([source]));
            if (mutable.data.has(id)) {
                $.data.set(id, mutable.data.get(id)!);
            }
        }
    }

    dropState(id: LocalId, source: string | typeof CLEAR_ALL): void {
        let remove = source === CLEAR_ALL;
        if (source !== CLEAR_ALL) {
            const leases = $.leases.get(id);
            if (leases === undefined) return console.error("Dropping state for shape without active lease.");
            leases.delete(source);
            remove = leases.size === 0;
        }
        if (remove) {
            $.leases.delete(id);
            $.data.delete(id);
        }
    }

    // A helper that handles load/drop for multiple ids at once without changing ids that remain active
    loadAndDropState(ids: ReadonlySet<LocalId>, source: string): void {
        const activeLeases = new Set(
            map(
                filter($.leases.entries(), ([, leases]) => leases.has(source)),
                ([id]) => id,
            ),
        );
        const diff = activeLeases.symmetricDifference(ids);
        for (const id of diff) {
            if (activeLeases.has(id)) {
                this.dropState(id, source);
            } else {
                this.loadState(id, source);
            }
        }
    }

    // BEHAVIOUR

    updateElement(id: LocalId, elementId: ElementId, data: ApiShapeCustomData): void {
        const target = ($.leases.has(id) ? $.data.get(id) : mutable.data.get(id)) ?? [];
        const element = target.find((element) => element.id === elementId);
        if (element === undefined) return;
        Object.assign(element, data);
    }

    setName(id: LocalId, elementId: ElementId, newName: string, sync: boolean): void {
        const target = ($.leases.has(id) ? $.data.get(id) : mutable.data.get(id)) ?? [];
        const element = target.find((element) => element.id === elementId);

        // Ensure the element exists AND the new name is unique
        if (element === undefined || this.getElementId({ ...getIdentifier(element), name: newName }) !== undefined)
            return;

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
        const target = ($.leases.has(id) ? $.data.get(id) : mutable.data.get(id)) ?? [];
        const element = target.find((element) => element.id === elementId);
        if (element === undefined) return;
        element.kind = newKind;
        element.value = customDataKindMap[newKind].defaultValue;
        if (sync) {
            sendShapeCustomDataUpdate(toApiShapeCustomData(element));
        }
    }

    updateValue(id: LocalId, elementId: ElementId, newValue: unknown, sync: boolean): void {
        const target = ($.leases.has(id) ? $.data.get(id) : mutable.data.get(id)) ?? [];
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
        const target = ($.leases.has(id) ? $.data.get(id) : mutable.data.get(id)) ?? [];
        const element = target.find((element) => element.id === elementId);
        if (element === undefined) return;
        element.reference = newReference;
        if (sync) {
            sendShapeCustomDataUpdate(toApiShapeCustomData(element));
        }
    }

    setDescription(id: LocalId, elementId: ElementId, newDescription: string, sync: boolean): void {
        const target = ($.leases.has(id) ? $.data.get(id) : mutable.data.get(id)) ?? [];
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
            ?.find(
                (el) =>
                    el.source.toLowerCase() === element.source.toLowerCase() &&
                    el.prefix.toLowerCase() === element.prefix.toLowerCase() &&
                    el.name.toLowerCase() === element.name.toLowerCase(),
            )?.id;
    }

    addBranch(id: LocalId, prefix: string): void {
        const shapeId = getGlobalId(id);
        if (shapeId === undefined) return;
        const target = ($.leases.has(id) ? $.data.get(id) : mutable.data.get(id)) ?? [];

        if (
            some(mutable.data.values(), (data) =>
                data.some(
                    (el) =>
                        el.prefix.toLowerCase() === prefix.toLowerCase() &&
                        el.source.toLowerCase() === "planarally" &&
                        el.shapeId === shapeId,
                ),
            )
        )
            return;

        target.push({
            shapeId,
            source: "planarally",
            prefix,
            name: "~~pending~branch~~", // a random name, empty strings will potentially conflict with addElement unique check
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

        const fullElement = { ...element, id: ID++ as ElementId };
        if (this.getElementId(getIdentifier(fullElement)) !== undefined) return;

        const hasLease = $.leases.has(id);
        if (!mutable.data.has(id)) {
            const newData: UiShapeCustomData[] = [];
            mutable.data.set(id, newData);
            if (hasLease) {
                $.data.set(id, newData);
            }
        }
        const targetBase = hasLease ? $.data : mutable.data;
        const target = targetBase.get(id)!;

        target.push(fullElement);
        if (sync && element.pending === undefined) {
            sendShapeCustomDataAdd(toApiShapeCustomData(fullElement));
        }
    }

    removeElement(id: LocalId, elementId: ElementId, sync: boolean): void {
        const target = ($.leases.has(id) ? $.data.get(id) : mutable.data.get(id)) ?? [];
        const index = target.findIndex((element) => element.id === elementId);
        if (index === -1) return;
        const element = target[index]!;
        target.splice(index, 1);
        if (sync) {
            sendShapeCustomDataRemove(getIdentifier(element));
        }
    }

    removeBranch(id: LocalId, prefix: string): void {
        const target = ($.leases.has(id) ? $.data.get(id) : mutable.data.get(id)) ?? [];
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

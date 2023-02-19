import { registerSystem, type ShapeSystem } from "..";
import type { ApiLabel } from "../../../apiTypes";
import { sendShapeAddLabel, sendShapeRemoveLabel } from "../../api/emits/shape/options";
import { getGlobalId, getShape, type LocalId } from "../../id";
import { floorSystem } from "../floors";

import { sendLabelAdd, sendLabelDelete, sendLabelFilterAdd, sendLabelFilterDelete } from "./emits";
import { labelState } from "./state";

const { mutableReactive: $, mutable, raw } = labelState;

class LabelSystem implements ShapeSystem {
    // Inform the system about the state of a certain LocalId
    inform(id: LocalId, data: ApiLabel[]): void {
        mutable.data.set(id, data);
    }

    drop(id: LocalId): void {
        mutable.data.delete(id);
        if ($.activeShape?.id === id) {
            $.activeShape = undefined;
        }
    }

    loadState(id: LocalId): void {
        $.activeShape = {
            id,
            labels: [...($.shapeLabels.get(id) ?? [])].map((l) => $.labels.get(l)!),
        };
    }

    dropState(): void {
        $.activeShape = undefined;
    }

    clear(): void {
        this.dropState();
        $.shapeLabels.clear();
        $.labels.clear();
    }

    // END OF ACTIVE SHAPE STUFF

    createLabel(label: ApiLabel, sync: boolean): void {
        $.labels.set(label.uuid, label);
        if (sync) sendLabelAdd(label);
    }

    addLabel(id: LocalId, labelId: string, sync: boolean): void {
        $.shapeLabels.get(id)?.add(labelId);
        if ($.activeShape?.id === id) {
            const label = $.labels.get(labelId);
            if (label === undefined) {
                console.error("Unknown label being added");
                return;
            }
            $.activeShape.labels.push(label);
        }
        if (sync) sendShapeAddLabel({ shape: getGlobalId(id)!, value: labelId });
    }

    removeLabel(id: LocalId, labelId: string, sync: boolean): void {
        $.shapeLabels.get(id)?.delete(labelId);
        if ($.activeShape?.id === id) {
            $.activeShape.labels = $.activeShape.labels.filter((l) => l.uuid !== labelId);
        }
        if (sync) sendShapeRemoveLabel({ shape: getGlobalId(id)!, value: labelId });
    }

    getLabels(id: LocalId): ApiLabel[] {
        const labels = $.shapeLabels.get(id);
        if (labels === undefined) return [];
        return [...labels].map((l) => $.labels.get(l)!);
    }

    addLabelFilter(filter: string, sync: boolean): void {
        $.labelFilters.push(filter);
        floorSystem.invalidateAllFloors();
        if (sync) sendLabelFilterAdd(filter);
    }

    setLabelFilters(filters: string[]): void {
        $.labelFilters = filters;
    }

    removeLabelFilter(filter: string, sync: boolean): void {
        const idx = $.labelFilters.indexOf(filter);
        if (idx >= 0) {
            $.labelFilters.splice(idx, 1);
            floorSystem.invalidateAllFloors();

            if (sync) sendLabelFilterDelete(filter);
        }
    }

    setLabelVisibility(uuid: string, visible: boolean): void {
        if (!$.labels.has(uuid)) return;
        $.labels.get(uuid)!.visible = visible;
    }

    deleteLabel(uuid: string, sync: boolean): void {
        if (!$.labels.has(uuid)) return;
        for (const [shapeId, labels] of $.shapeLabels.entries()) {
            labels.delete(uuid);
            getShape(shapeId)?.layer?.invalidate(false);
        }
        $.labels.delete(uuid);

        if (sync) sendLabelDelete(uuid);
    }

    isFiltered(id: LocalId): boolean {
        const shapeLabels = raw.shapeLabels.get(id);
        if ((shapeLabels === undefined || shapeLabels.size === 0) && raw.filterNoLabel) return true;
        if (
            (shapeLabels?.size ?? 0) > 0 &&
            raw.labelFilters.length &&
            ![...shapeLabels!].some((l) => raw.labelFilters.includes(l))
        )
            return true;
        return false;
    }
}

export const labelSystem = new LabelSystem();
registerSystem("labels", labelSystem, false, labelState);

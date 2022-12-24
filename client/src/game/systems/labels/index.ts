import { registerSystem } from "..";
import type { System } from "..";
import { getAllShapes } from "../../id";
import { floorSystem } from "../floors";

import { sendLabelAdd, sendLabelDelete, sendLabelFilterAdd, sendLabelFilterDelete } from "./emits";
import type { Label } from "./models";
import { labelState } from "./state";

const { mutableReactive: $ } = labelState;

class LabelSystem implements System {
    clear(): void {}

    addLabel(label: Label, sync: boolean): void {
        $.labels.set(label.uuid, label);
        if (sync) sendLabelAdd(label);
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
        const label = $.labels.get(uuid)!;
        for (const shape of getAllShapes()) {
            const i = shape.labels.indexOf(label);
            if (i >= 0) {
                shape.labels.splice(i, 1);
                shape.layer.invalidate(false);
            }
        }
        $.labels.delete(uuid);

        if (sync) sendLabelDelete({ uuid });
    }
}

export const labelSystem = new LabelSystem();
registerSystem("labels", labelSystem, false, labelState);

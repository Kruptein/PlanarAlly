import { subtractP, toLP } from "../../../core/geometry";
import type { LocalPoint } from "../../../core/geometry";
import { i18n } from "../../../i18n";
import { sendClientLocationOptions } from "../../api/emits/client";
import { ToolName } from "../../models/tools";
import type { ToolPermission } from "../../models/tools";
import { floorSystem } from "../../systems/floors";
import { positionSystem } from "../../systems/position";
import { positionState } from "../../systems/position/state";
import { SelectFeatures } from "../models/select";
import { Tool } from "../tool";

class PanTool extends Tool {
    readonly toolName = ToolName.Pan;
    readonly toolTranslation = i18n.global.t("tool.Pan");

    private panStart = toLP(0, 0);

    get permittedTools(): ToolPermission[] {
        return [{ name: ToolName.Select, features: { enabled: [SelectFeatures.Context] } }];
    }

    panScreen(target: LocalPoint, full: boolean): void {
        const distance = subtractP(target, this.panStart).multiply(1 / positionState.readonly.zoom);
        positionSystem.increasePan(Math.round(distance.x), Math.round(distance.y));
        this.panStart = target;

        if (full) floorSystem.invalidateAllFloors();
        else floorSystem.invalidateVisibleFloors();
        sendClientLocationOptions(!full);
    }

    onDown(lp: LocalPoint): Promise<void> {
        this.panStart = lp;
        this.active.value = true;
        return Promise.resolve();
    }

    onMove(lp: LocalPoint): Promise<void> {
        if (this.active.value) this.panScreen(lp, false);
        return Promise.resolve();
    }

    onUp(lp: LocalPoint): Promise<void> {
        if (!this.active.value) return Promise.resolve();
        this.active.value = false;
        this.panScreen(lp, true);
        return Promise.resolve();
    }
}

export const panTool = new PanTool();

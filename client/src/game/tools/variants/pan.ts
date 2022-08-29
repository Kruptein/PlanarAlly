import { subtractP, toLP } from "../../../core/geometry";
import type { LocalPoint } from "../../../core/geometry";
import { i18n } from "../../../i18n";
import { clientStore, ZOOM } from "../../../store/client";
import { sendClientLocationOptions } from "../../api/emits/client";
import { ToolName } from "../../models/tools";
import type { ToolPermission } from "../../models/tools";
import { floorSystem } from "../../systems/floors";
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
        const distance = subtractP(target, this.panStart).multiply(1 / ZOOM);
        clientStore.increasePan(Math.round(distance.x), Math.round(distance.y));
        this.panStart = target;

        if (full) floorSystem.invalidateAllFloors();
        else floorSystem.invalidateVisibleFloors();
        sendClientLocationOptions(!full);
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    async onDown(lp: LocalPoint): Promise<void> {
        this.panStart = lp;
        this.active.value = true;
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    async onMove(lp: LocalPoint): Promise<void> {
        if (!this.active.value) return;
        this.panScreen(lp, false);
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    async onUp(lp: LocalPoint): Promise<void> {
        if (!this.active.value) return;
        this.active.value = false;
        this.panScreen(lp, true);
    }
}

export const panTool = new PanTool();

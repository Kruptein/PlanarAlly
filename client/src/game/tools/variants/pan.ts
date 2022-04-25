import { subtractP, toLP } from "../../../core/geometry";
import type { LocalPoint } from "../../../core/geometry";
import { i18n } from "../../../i18n";
import { clientStore } from "../../../store/client";
import { floorStore } from "../../../store/floor";
import { sendClientLocationOptions } from "../../api/emits/client";
import { ToolName } from "../../models/tools";
import type { ToolPermission } from "../../models/tools";
import { Tool } from "../tool";

import { SelectFeatures } from "./select";

class PanTool extends Tool {
    readonly toolName = ToolName.Pan;
    readonly toolTranslation = i18n.global.t("tool.Pan");

    private panStart = toLP(0, 0);

    get permittedTools(): ToolPermission[] {
        return [{ name: ToolName.Select, features: { enabled: [SelectFeatures.Context] } }];
    }

    panScreen(target: LocalPoint, full: boolean): void {
        const distance = subtractP(target, this.panStart).multiply(1 / clientStore.zoomFactor.value);
        clientStore.increasePanX(Math.round(distance.x));
        clientStore.increasePanY(Math.round(distance.y));
        this.panStart = target;

        if (full) floorStore.invalidateAllFloors();
        else floorStore.invalidateVisibleFloors();
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
        sendClientLocationOptions();
    }
}

export const panTool = new PanTool();

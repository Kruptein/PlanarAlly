import { toLP } from "../../../../core/geometry";
import type { LocalPoint } from "../../../../core/geometry";
import { i18n } from "../../../../i18n";
import { ToolName } from "../../../core/models/tools";
import type { ITool, ToolPermission } from "../../../core/models/tools";
import { postRender } from "../../../messages/render";
// import { SelectFeatures } from "../models/select";
import { Tool } from "../tool";

class PanTool extends Tool implements ITool {
    readonly toolName = ToolName.Pan;
    readonly toolTranslation = i18n.global.t("tool.Pan");

    private panStart = toLP(0, 0);

    get permittedTools(): ToolPermission[] {
        return []; // { name: ToolName.Select, features: { enabled: [SelectFeatures.Context] } }];
    }

    panScreen(target: LocalPoint, full: boolean): void {
        void postRender("Tool.Pan", { origin: this.panStart, target, full });
        this.panStart = target;
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

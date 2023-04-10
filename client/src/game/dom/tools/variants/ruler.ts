import { ref } from "vue";

import type { LocalPoint } from "../../../../core/geometry";
import { i18n } from "../../../../i18n";
import { ToolName } from "../../../core/models/tools";
import type { ITool, ToolFeatures, ToolPermission } from "../../../core/models/tools";
import { postRender } from "../../../messages/render";
import { getPressedModifiers } from "../../input/events";
import { SelectFeatures } from "../models/select";
import { Tool } from "../tool";

export enum RulerFeatures {
    All,
}

class RulerTool extends Tool implements ITool {
    readonly toolName = ToolName.Ruler;
    readonly toolTranslation = i18n.global.t("tool.Ruler");

    // REACTIVE PROPERTIES
    showPublic = ref(false);

    // NON REACTIVE PROPERTIES

    get permittedTools(): ToolPermission[] {
        return [{ name: ToolName.Select, features: { enabled: [SelectFeatures.Context] } }];
    }

    async setShowPublic(value: boolean): Promise<void> {
        this.showPublic.value = value;
        await postRender("Tool.Ruler.Public.Set", value);
    }

    // EVENT HANDLERS

    async onSelect(): Promise<void> {
        await postRender("Tool.Ruler.Cleanup", {});
    }

    async onDeselect(): Promise<void> {
        await postRender("Tool.Ruler.Cleanup", {});
    }

    async onDown(lp: LocalPoint, event: MouseEvent | TouchEvent | undefined): Promise<void> {
        await postRender("Tool.Ruler.Down", { lp, pressed: getPressedModifiers(event) });
    }

    async onMove(lp: LocalPoint, event: MouseEvent | TouchEvent | undefined): Promise<void> {
        await postRender("Tool.Ruler.Move", { lp, pressed: getPressedModifiers(event) });
    }

    async onUp(): Promise<void> {
        await postRender("Tool.Ruler.Cleanup", {});
    }

    async onKeyUp(event: KeyboardEvent, features: ToolFeatures): Promise<void> {
        if (event.defaultPrevented) return;
        if (event.key === " " && this.active.value) {
            await postRender("Tool.Ruler.Split", {});
            event.preventDefault();
        }
        super.onKeyUp(event, features);
    }
}

export const rulerTool = new RulerTool();

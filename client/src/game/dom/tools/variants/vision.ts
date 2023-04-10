import { computed } from "vue";

import { i18n } from "../../../../i18n";
import { ToolName } from "../../../core/models/tools";
import type { ITool, ToolPermission } from "../../../core/models/tools";
import { accessState } from "../../../core/systems/access/state";
import { SelectFeatures } from "../models/select";
import { Tool } from "../tool";

class VisionTool extends Tool implements ITool {
    readonly toolName = ToolName.Vision;
    readonly toolTranslation = i18n.global.t("tool.Vision");

    alert = computed(() => accessState.reactive.activeTokenFilters !== undefined);

    get permittedTools(): ToolPermission[] {
        return [{ name: ToolName.Select, features: { disabled: [SelectFeatures.Resize, SelectFeatures.Rotate] } }];
    }
}

export const visionTool = new VisionTool();

import { computed } from "vue";

import { i18n } from "../../../i18n";
import { ToolName } from "../../models/tools";
import type { ITool, ToolPermission } from "../../models/tools";
import { accessState } from "../../systems/access/state";
import { SelectFeatures } from "../models/select";
import { Tool } from "../tool";

class VisionTool extends Tool implements ITool {
    readonly toolName = ToolName.Vision;
    readonly toolTranslation = i18n.global.t("tool.Vision");

    alert = computed(() => accessState.reactive.activeTokenFilters.get("vision") !== undefined);

    get permittedTools(): ToolPermission[] {
        return [
            {
                name: ToolName.Select,
                features: { disabled: [SelectFeatures.Resize, SelectFeatures.Rotate] },
            },
        ];
    }
}

export const visionTool = new VisionTool();

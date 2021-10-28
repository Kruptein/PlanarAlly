import { i18n } from "../../../i18n";
import { ToolName } from "../../models/tools";
import type { ToolPermission } from "../../models/tools";
import { Tool } from "../tool";

import { SelectFeatures } from "./select";

class VisionTool extends Tool {
    readonly toolName = ToolName.Vision;
    readonly toolTranslation = i18n.global.t("tool.Vision");

    get permittedTools(): ToolPermission[] {
        return [{ name: ToolName.Select, features: { disabled: [SelectFeatures.Resize, SelectFeatures.Rotate] } }];
    }
}

export const visionTool = new VisionTool();

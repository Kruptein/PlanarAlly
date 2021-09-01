import { i18n } from "../../../i18n";
import { ToolName } from "../../models/tools";
import type { ToolPermission } from "../../models/tools";
import { Tool } from "../tool";

import { SelectFeatures } from "./select";

class FilterTool extends Tool {
    readonly toolName = ToolName.Filter;
    readonly toolTranslation = i18n.global.t("tool.Filter");

    get permittedTools(): ToolPermission[] {
        return [{ name: ToolName.Select, features: { disabled: [SelectFeatures.Resize, SelectFeatures.Rotate] } }];
    }
}

export const filterTool = new FilterTool();

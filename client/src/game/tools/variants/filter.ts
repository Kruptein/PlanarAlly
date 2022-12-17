import { i18n } from "../../../i18n";
import { ToolName } from "../../models/tools";
import type { ITool, ToolPermission } from "../../models/tools";
import { SelectFeatures } from "../models/select";
import { Tool } from "../tool";

class FilterTool extends Tool implements ITool {
    readonly toolName = ToolName.Filter;
    readonly toolTranslation = i18n.global.t("tool.Filter");

    get permittedTools(): ToolPermission[] {
        return [{ name: ToolName.Select, features: { disabled: [SelectFeatures.Resize, SelectFeatures.Rotate] } }];
    }
}

export const filterTool = new FilterTool();

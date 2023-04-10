import { ToolName } from "../../../core/models/tools";
import type { ITool, ToolPermission } from "../../../core/models/tools";
import { Tool } from "../tool";

class LastGameboardTool extends Tool implements ITool {
    readonly toolName = ToolName.LastGameboard;
    readonly toolTranslation = "Minis";

    get permittedTools(): ToolPermission[] {
        return [];
    }
}

export const lastGameboardTool = new LastGameboardTool();

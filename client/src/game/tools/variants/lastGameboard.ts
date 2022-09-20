import { ToolName } from "../../models/tools";
import type { ToolPermission } from "../../models/tools";
import { Tool } from "../tool";

class LastGameboardTool extends Tool {
    readonly toolName = ToolName.LastGameboard;
    readonly toolTranslation = "Minis";

    get permittedTools(): ToolPermission[] {
        return [];
    }
}

export const lastGameboardTool = new LastGameboardTool();

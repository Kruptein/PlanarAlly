import { i18n } from "../../../i18n";
import { ToolName } from "../../models/tools";
import type { ITool, ToolPermission } from "../../models/tools";
import { SelectFeatures } from "../models/select";
import { Tool } from "../tool";

/*
This is a bit of a silly tool,
but the current tools implementation doesn't allow to activate the Select tool with specific features.
*/

class NoteTool extends Tool implements ITool {
    readonly toolName = ToolName.Note;
    readonly toolTranslation = i18n.global.t("tool.Note");

    get permittedTools(): ToolPermission[] {
        return [{ name: ToolName.Select, features: { enabled: [SelectFeatures.ChangeSelection] } }];
    }

    onDeselect(): void {
        this.active.value = false;
    }

    onSelect(): Promise<void> {
        this.active.value = true;
        return Promise.resolve();
    }
}

export const noteTool = new NoteTool();

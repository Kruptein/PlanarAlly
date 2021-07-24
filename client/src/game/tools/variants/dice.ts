import { DiceThrower, DndParser } from "@planarally/dice";

import { i18n } from "../../../i18n";
import { ToolName, ToolPermission } from "../../models/tools";
import { Tool } from "../tool";

import { SelectFeatures } from "./select";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const env = () => import("../../dice/environment");

class DiceTool extends Tool {
    readonly toolName = ToolName.Dice;
    readonly toolTranslation = i18n.global.t("tool.Dice");

    diceThrower!: DiceThrower;
    dndParser!: DndParser;

    async onSelect(): Promise<void> {
        if (this.diceThrower === undefined) {
            const e = await env();
            this.diceThrower = await e.loadDiceEnv();
            this.dndParser = new DndParser(this.diceThrower);
        }
    }

    get permittedTools(): ToolPermission[] {
        return [{ name: ToolName.Select, features: { disabled: [SelectFeatures.Resize, SelectFeatures.Rotate] } }];
    }
}

export const diceTool = new DiceTool();

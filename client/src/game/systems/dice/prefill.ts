import type { LocalId } from "../../../core/id";
import { ToolName } from "../../models/tools";
import { activateTool } from "../../tools/tools";
import { qualifyReferences } from "../customData/utils";

import { diceSystem } from ".";

// Opens the dice tool with the input ready to be rolled
export function prefillDiceTool(input: string, shape?: LocalId): void {
    diceSystem.setInput(qualifyReferences(input, shape));
    activateTool(ToolName.Dice);
}

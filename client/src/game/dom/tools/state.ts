import { ref } from "vue";

import { ToolMode, ToolName } from "../../core/models/tools";

export const activeToolMode = ref(ToolMode.Play);

export const activeTool = ref(ToolName.Select);

export function activateTool(tool: ToolName): void {
    activeTool.value = tool;
}

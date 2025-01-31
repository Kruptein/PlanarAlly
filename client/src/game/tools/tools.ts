import { computed, ref, watch } from "vue";

import { ToolMode, ToolName } from "../models/tools";
import type { ITool, ToolFeatures } from "../models/tools";

import { SelectFeatures } from "./models/select";
import { diceTool } from "./variants/dice";
import { drawTool } from "./variants/draw";
import { mapTool } from "./variants/map";
import { noteTool } from "./variants/note";
import { panTool } from "./variants/pan";
import { pingTool } from "./variants/ping";
import { rulerTool } from "./variants/ruler";
import { selectTool } from "./variants/select";
import { spellTool } from "./variants/spell";
import { visionTool } from "./variants/vision";

export const activeToolMode = ref(ToolMode.Play);

export const activeTool = ref(ToolName.Select);

export const toolMap: Record<ToolName, ITool> = {
    [ToolName.Select]: selectTool,
    [ToolName.Pan]: panTool,
    [ToolName.Draw]: drawTool,
    [ToolName.Ruler]: rulerTool,
    [ToolName.Ping]: pingTool,
    [ToolName.Map]: mapTool,
    [ToolName.Vision]: visionTool,
    [ToolName.Spell]: spellTool,
    [ToolName.Dice]: diceTool,
    [ToolName.Note]: noteTool,
};
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(window as any).toolMap = toolMap;

const buildTools: [ToolName, ToolFeatures][] = [
    [ToolName.Select, {}],
    [ToolName.Pan, {}],
    [ToolName.Draw, {}],
    [ToolName.Ruler, {}],
    [ToolName.Map, {}],
    [ToolName.Vision, {}],
];
const playTools: [ToolName, ToolFeatures][] = [
    [ToolName.Select, { disabled: [SelectFeatures.Resize, SelectFeatures.Rotate, SelectFeatures.PolygonEdit] }],
    [ToolName.Pan, {}],
    [ToolName.Spell, {}],
    [ToolName.Ruler, {}],
    [ToolName.Ping, {}],
    [ToolName.Vision, {}],
    [ToolName.Dice, {}],
];

export const dmTools = [ToolName.Map];

export const activeModeTools = computed(() => (activeToolMode.value === ToolMode.Build ? buildTools : playTools));

watch(activeTool, (newTool, oldTool) => {
    toolMap[oldTool].onDeselect();
    toolMap[newTool].onSelect();
});

export function getActiveTool(): ITool {
    return toolMap[activeTool.value];
}

export function toggleActiveMode(): void {
    activeToolMode.value = activeToolMode.value === ToolMode.Build ? ToolMode.Play : ToolMode.Build;

    if (!buildTools.some((t) => t[0] === activeTool.value) || !playTools.some((t) => t[0] === activeTool.value)) {
        activeTool.value = ToolName.Select;
    }

    const tool = getActiveTool();
    for (const permitted of tool.permittedTools) {
        if (!(permitted.early ?? false)) continue;
        toolMap[permitted.name].onToolsModeChange(activeToolMode.value, permitted.features);
    }
    tool.onToolsModeChange(activeToolMode.value, getFeatures(activeTool.value));
    for (const permitted of tool.permittedTools) {
        if (permitted.early ?? false) continue;
        toolMap[permitted.name].onToolsModeChange(activeToolMode.value, permitted.features);
    }
}

export function getFeatures(tool: ToolName): ToolFeatures {
    return activeModeTools.value.find((t) => t[0] === tool)?.[1] ?? {};
}

export function activateTool(tool: ToolName): void {
    activeTool.value = tool;
}

import type { GameApi } from "@planarally/mod-api";

import { eventBus } from "../core/eventBus";
import { hooks } from "../core/hooks";
import { SYSTEMS, SYSTEMS_STATE } from "../core/systems";
import { getGlobalId, getShape } from "../game/id";
import { registerContextMenuEntry, registerTab } from "../game/systems/ui/mods";

import { getDataBlockFunctions } from "./db";
import { trackRegistration } from "./registry";

export async function buildModApi(modId: string, tag: string): Promise<GameApi> {
    const { activateTool } = await import("../game/tools/tools");
    const { modals } = await import("../core/plugins/modals/plugin");
    return {
        systems: SYSTEMS as unknown as GameApi["systems"],
        systemsState: SYSTEMS_STATE as unknown as GameApi["systemsState"],
        ui: {
            shape: {
                registerContextMenuEntry: (entry) => trackRegistration(modId, registerContextMenuEntry(entry)),
                registerTab: (tab, filter) => trackRegistration(modId, registerTab(tab, filter)),
            },
            modals,
        },
        gameplay: {
            activateTool: (toolName: string) => {
                activateTool(toolName as Parameters<typeof activateTool>[0]);
            },
        },
        getGlobalId,
        getShape,
        eventBus: {
            on: (event, handler) => trackRegistration(modId, eventBus.on(event as never, handler as never)),
            once: (event, handler) => trackRegistration(modId, eventBus.once(event as never, handler as never)),
            emit: (event, payload) => {
                eventBus.emit(event as never, payload as never);
            },
        },
        hooks: {
            tap: (hook, handler) => trackRegistration(modId, hooks.tap(hook as never, handler as never)),
            pipe: (hook, initialValue, context) => hooks.pipe(hook as never, initialValue as never, context as never),
        },
        ...getDataBlockFunctions(tag),
    };
}

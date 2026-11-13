import type { CompendiumRecord, GameApi, ModalComponent } from "@planarally/mod-api";
import { markRaw } from "vue";

import { eventBus } from "../core/eventBus";
import { hooks } from "../core/hooks";
import { SYSTEMS, SYSTEMS_STATE } from "../core/systems";
import { getGlobalId, getShape } from "../game/id";
import { compendiumSystem } from "../game/systems/compendium";
import type { RuleRef } from "../game/systems/compendium/types";
import { modalSystem } from "../game/systems/modals";
import { modalState } from "../game/systems/modals/state";
import type { FullModal } from "../game/systems/modals/types";
import { registerContextMenuEntry, registerTab } from "../game/systems/ui/mods";

import { getModApi, provideModApi } from "./apis";
import { getDataBlockFunctions } from "./db";
import { prefillDice, rollDice, simplifyDiceExpression, useSimplifiedDice } from "./dice";
import type { HostSystems, HostSystemsState } from "./hostSystems";
import { trackRegistration } from "./registry";

function addModal(modal: FullModal): () => void {
    const index = modalSystem.addModal(modal);
    const extraIndex = index - modalState.readonly.fixedModals.length;
    const entry = modalState.raw.extraModals[extraIndex];
    return () => {
        // Leaving a location clears all extra modals, after which the index can be reused by another modal
        if (modalState.raw.extraModals[extraIndex] === entry) modalSystem.close(index, true);
    };
}

export async function buildModApi(modId: string, tag: string): Promise<GameApi> {
    const { activateTool } = await import("../game/tools/tools");
    const { modals } = await import("../core/plugins/modals/plugin");
    const { default: Modal } = await import("../core/components/modals/Modal.vue");
    return {
        // Typed as the host systems, so the declarations in the mod api are checked against them
        systems: SYSTEMS as unknown as HostSystems,
        systemsState: SYSTEMS_STATE as unknown as HostSystemsState,
        ui: {
            shape: {
                registerContextMenuEntry: (entry) => trackRegistration(modId, registerContextMenuEntry(entry)),
                registerTab: (tab, filter) => trackRegistration(modId, registerTab(tab, filter)),
            },
            modals: {
                add: (modal) => trackRegistration(modId, addModal(modal)),
                confirm: modals.confirm,
                prompt: modals.prompt,
                selectionBox: modals.selectionBox,
            },
        },
        components: {
            Modal: markRaw(Modal) as ModalComponent,
        },
        gameplay: {
            activateTool: (toolName: string) => {
                activateTool(toolName as Parameters<typeof activateTool>[0]);
            },
        },
        dice: {
            simplify: simplifyDiceExpression,
            useSimplified: useSimplifiedDice,
            // Rolling registers nothing, so these don't need to be tracked per mod
            roll: rollDice,
            prefill: prefillDice,
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
        compendium: {
            register: (entries, options) =>
                trackRegistration(modId, compendiumSystem.registerEntries(tag, entries, options)),
            getEntries: <T = unknown>(system: string, kind: string): CompendiumRecord<T>[] =>
                compendiumSystem.getEntries<T>(system, kind),
            getEntry: (ref) => compendiumSystem.getEntry(ref),
            openRuleAt: (ref, x, y) => {
                compendiumSystem.openRuleAt(ref as RuleRef, x, y);
            },
        },
        ...getDataBlockFunctions(tag),
        provideApi: (api) => trackRegistration(modId, provideModApi(tag, api)),
        getModApi,
    };
}

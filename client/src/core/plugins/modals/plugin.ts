import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { createApp, inject, nextTick } from "vue";
import type { InjectionKey, Plugin } from "vue";

import PluginContainer from "../../components/PluginContainer.vue";

import { useConfirm } from "./confirm";
import type { ConfirmFunction } from "./confirm";
import { usePrompt } from "./prompt";
import type { PromptFunction } from "./prompt";
import { useSelectionBox } from "./selectionBox";
import type { SelectionBoxFunction } from "./selectionBox";

const modalSymbol: InjectionKey<Modals> = Symbol("PlanarAllyModals");

interface Modals {
    confirm: ConfirmFunction;
    prompt: PromptFunction;
    selectionBox: SelectionBoxFunction;
}

async function createModals(): Promise<Modals> {
    const confirm = useConfirm();
    const prompt = usePrompt();
    const selectionBox = useSelectionBox();

    await nextTick(() => {
        const app = createApp(PluginContainer, { confirm, prompt, selectionBox }).component(
            "font-awesome-icon",
            FontAwesomeIcon,
        );
        const d = document.createElement("div");
        document.body.appendChild(d);
        app.mount(d);
        d.removeAttribute("data-v-app");
    });

    return {
        confirm: confirm.show,
        prompt: prompt.ask,
        selectionBox: selectionBox.open,
    };
}

export let modals: Modals | undefined = undefined;

export const PlanarAllyModalsPlugin: Plugin = async (App) => {
    modals = await createModals();
    App.provide(modalSymbol, modals);
};

export function useModal(): Modals {
    const _modals = inject(modalSymbol);
    if (_modals === undefined) {
        throw new Error("Could not inject modals");
    }
    return _modals;
}

import { createApp, inject, InjectionKey, nextTick, Plugin } from "vue";

import PluginContainer from "../../components/PluginContainer.vue";

import { AssetPickerFunction, useAssetPicker } from "./assetPicker";
import { ConfirmFunction, useConfirm } from "./confirm";
import { PromptFunction, usePrompt } from "./prompt";
import { SelectionBoxFunction, useSelectionBox } from "./selectionBox";

const modalSymbol: InjectionKey<Modals> = Symbol("PlanarAllyModals");

interface Modals {
    assetPicker: AssetPickerFunction;
    confirm: ConfirmFunction;
    prompt: PromptFunction;
    selectionBox: SelectionBoxFunction;
}

function createModals(): Modals {
    const assetPicker = useAssetPicker();
    const confirm = useConfirm();
    const prompt = usePrompt();
    const selectionBox = useSelectionBox();

    nextTick(() => {
        const app = createApp(PluginContainer, { assetPicker, confirm, prompt, selectionBox });
        const d = document.createElement("div");
        document.body.appendChild(d);
        app.mount(d);
        d.removeAttribute("data-v-app");
    });

    return {
        assetPicker: assetPicker.show,
        confirm: confirm.show,
        prompt: prompt.ask,
        selectionBox: selectionBox.open,
    };
}

export const PlanarAllyModalsPlugin: Plugin = (App) => {
    const modals = createModals();
    App.provide(modalSymbol, modals);
};

export function useModal(): Modals {
    const modals = inject(modalSymbol);
    if (modals === undefined) {
        throw new Error("Could not inject modals");
    }
    return modals;
}

import { readonly, reactive, toRefs } from "vue";
import type { DeepReadonly, Ref } from "vue";

type buttons = { yes?: string; no?: string; focus?: "confirm" | "deny"; showNo?: boolean };

export type ConfirmFunction = (title: string, text?: string, buttons?: buttons) => Promise<boolean | undefined>;

interface ConfirmModal {
    visible: DeepReadonly<Ref<boolean>>;
    yes: Ref<string>;
    no: Ref<string>;
    showNo: Ref<boolean>;
    title: Ref<string>;
    text: Ref<string>;
    focus: Ref<string>;
    close: () => void;
    show: ConfirmFunction;
    submit: (value: boolean) => void;
}

export function useConfirm(): ConfirmModal {
    const data = reactive({
        visible: false,
        yes: "Yes",
        no: "No",
        showNo: true,
        title: "",
        text: "",
        focus: "deny",
    });

    let resolve: (value: boolean | undefined) => void = (_value: boolean | undefined) => {};

    async function show(title: string, text = "", buttons?: buttons): Promise<boolean | undefined> {
        data.visible = true;
        data.yes = buttons?.yes ?? "yes";
        data.no = buttons?.no ?? "no";
        data.showNo = buttons?.showNo ?? true;
        data.focus = buttons?.focus ?? (data.showNo ? "deny" : "confirm");
        data.title = title;
        data.text = text;
        return new Promise((res) => (resolve = res));
    }

    function submit(answer: boolean): void {
        resolve(answer);
        data.visible = false;
    }

    function close(): void {
        resolve(undefined);
        data.visible = false;
    }

    const refs = { ...toRefs(data) };
    return { show, close, submit, ...refs, visible: readonly(refs.visible) };
}

import { readonly, reactive, toRefs } from "vue";
import type { DeepReadonly, Ref } from "vue";

export interface SelectionBoxOptions {
    text?: string;
    defaultButton?: string;
    customButton?: string;
    multiSelect?: boolean;
    defaultSelect?: string[];
}

export type SelectionBoxFunction = (
    title: string,
    choices: string[],
    options?: SelectionBoxOptions,
) => Promise<string[] | undefined>;

export interface SelectionBoxModal {
    visible: DeepReadonly<Ref<boolean>>;
    title: Ref<string>;
    choices: Ref<string[]>;
    options?: Ref<SelectionBoxOptions | undefined>;
    open: SelectionBoxFunction;
    close: () => void;
    submit: (choice: string[]) => void;
}

export function useSelectionBox(): SelectionBoxModal {
    const data = reactive({
        visible: false,
        title: "",
        choices: [] as string[],
        options: { multiSelect: false } as SelectionBoxOptions | undefined,
    });

    let resolve: (value: string[] | undefined) => void = (_value: string[] | undefined) => {};

    async function open(
        title: string,
        choices: string[],
        options?: SelectionBoxOptions,
    ): Promise<string[] | undefined> {
        data.visible = true;
        data.title = title;
        data.choices = choices;
        data.options = options;
        return new Promise((res) => (resolve = res));
    }

    function submit(answer: string[]): void {
        resolve(answer);
        data.visible = false;
    }

    function close(): void {
        resolve(undefined);
        data.visible = false;
    }

    const refs = { ...toRefs(data) };
    return { ...refs, close, open, submit, visible: readonly(refs.visible) };
}

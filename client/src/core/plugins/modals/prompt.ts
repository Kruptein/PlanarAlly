import { readonly, reactive, toRefs } from "vue";
import type { DeepReadonly, Ref } from "vue";

type validationFunc = (value: string) => { valid: true } | { valid: false; reason: string };

export type PromptFunction = (
    question: string,
    title: string,
    validation?: validationFunc,
) => Promise<string | undefined>;

export interface PromptModal {
    visible: DeepReadonly<Ref<boolean>>;
    question: Ref<string>;
    title: Ref<string>;
    error: Ref<string>;
    ask: PromptFunction;
    close: () => void;
    submit: (answer: string) => void;
}

const defaultValidationFunction: validationFunc = (_value) => ({
    valid: true,
});

export function usePrompt(): PromptModal {
    const data = reactive({
        visible: false,
        question: "",
        title: "",
        error: "",
    });

    let validationFunction = defaultValidationFunction;

    // oxlint-disable-next-line unicorn/consistent-function-scoping
    let resolve: (value: string | undefined) => void = (_value: string | undefined) => {};

    async function ask(question: string, title: string, validation?: validationFunc): Promise<string | undefined> {
        data.visible = true;
        data.question = question;
        data.title = title;
        data.error = "";
        if (validation) validationFunction = validation;
        else validationFunction = defaultValidationFunction;
        return new Promise((res) => (resolve = res));
    }

    function submit(answer: string): void {
        const validation = validationFunction(answer);
        if (validation.valid) {
            resolve(answer);
            data.visible = false;
        } else {
            data.error = validation.reason;
        }
    }

    function close(): void {
        resolve(undefined);
        data.visible = false;
    }

    const refs = { ...toRefs(data) };
    return { ask, close, submit, ...refs, visible: readonly(refs.visible) };
}

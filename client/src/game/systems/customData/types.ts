import { defineAsyncComponent, type Component } from "vue";

import type { ApiShapeCustomData } from "../../../apiTypes";
import type { NumberId } from "../../../core/id";

const DiceFormat = defineAsyncComponent(() => import("./components/DiceFormat.vue"));
const ToggleFormat = defineAsyncComponent(() => import("./components/ToggleFormat.vue"));

export type ElementId = NumberId<"ElementId">;

export enum ShapeCustomDataPending {
    Branch,
    Leaf,
}
export type UiShapeCustomData = ApiShapeCustomData & { id: ElementId; pending?: ShapeCustomDataPending };

export interface CustomDataKindInfo<T extends UiShapeCustomData> {
    defaultValue: T extends { value: infer V } ? V : undefined;
    format: ((element: T) => string) | { component: Component<{ element: T }> };
    editRender:
        | ((element: T) => {
              attrs: { type: string } & Record<string, string>;
              onSave: (event: HTMLInputElement) => T["value"];
          })
        | { component: Component<{ element: T }> };
}

export type CustomDataKindMap = {
    [K in UiShapeCustomData["kind"]]: CustomDataKindInfo<Extract<UiShapeCustomData, { kind: K }>>;
};

export const customDataKindMap: CustomDataKindMap = {
    number: {
        defaultValue: 0,
        format: (element) => element.value.toString(),
        editRender: (element) => ({
            attrs: {
                type: "number",
                value: element.value.toString(),
            },
            onSave: (target) => parseFloat(target.value),
        }),
    },
    text: {
        defaultValue: "",
        format: (element) => element.value,
        editRender: (element) => ({
            attrs: { type: "text", value: element.value },
            onSave: (target) => target.value,
        }),
    },
    boolean: {
        defaultValue: false,
        format: { component: ToggleFormat },
        editRender: (element) => ({
            attrs: { type: "checkbox", ...(element.value ? { checked: "checked" } : {}) },
            onSave: (target) => target.checked,
        }),
    },
    "dice-expression": {
        defaultValue: "",
        format: { component: DiceFormat },
        editRender: (element) => ({
            attrs: { type: "text", value: element.value },
            onSave: (target) => target.value,
        }),
    },
};

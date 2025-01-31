import type { Component, ComputedRef } from "vue";

import type { NumberId } from "../../../core/id";

export interface FullModal {
    component: Component;
    condition?: ComputedRef<boolean>;
    props?: Record<string, unknown>;
}
export type Modal = Component | FullModal;
export type IndexedModal = FullModal & { props: { modalIndex: ModalIndex } & Record<string, unknown> };
export type ModalIndex = NumberId<"modal">;

import type { CompendiumView } from "@planarally/mod-api";
import { shallowReactive } from "vue";

import { buildState } from "../../../core/systems/state";

import type { IndexedEntry, RuleRef } from "./types";

interface OwnedView {
    mod: string;
    view: CompendiumView;
}

interface CompendiumState {
    byRef: Map<RuleRef, IndexedEntry>;
    views: Map<string, OwnedView[]>;
    open: boolean;
    popover: {
        ref: RuleRef | null;
        x: number;
        y: number;
    };
}

const state = buildState<CompendiumState>({
    byRef: shallowReactive(new Map()),
    views: shallowReactive(new Map()),
    open: false,
    popover: {
        ref: null,
        x: 0,
        y: 0,
    },
});

export const compendiumState = {
    ...state,
};

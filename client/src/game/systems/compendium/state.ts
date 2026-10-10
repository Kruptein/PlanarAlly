import type { CompendiumView } from "@planarally/mod-api";
import { shallowReactive } from "vue";

import { buildState } from "../../../core/systems/state";

import type { IndexedEntry, RuleRef } from "./types";

interface CompendiumState {
    byRef: Map<RuleRef, IndexedEntry>;
    bookNames: Map<string, string>;
    bookViews: Map<string, CompendiumView[]>;
    open: boolean;
    popover: {
        ref: RuleRef | null;
        x: number;
        y: number;
    };
}

const state = buildState<CompendiumState>({
    byRef: shallowReactive(new Map()),
    bookNames: shallowReactive(new Map()),
    bookViews: shallowReactive(new Map()),
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

import { buildState } from "../state";

import type { Label } from "./models";

interface LabelState {
    labels: Map<string, Label>;
    filterNoLabel: boolean;
    labelFilters: string[];
}

const state = buildState<LabelState>({
    labels: new Map(),
    filterNoLabel: false,
    labelFilters: [],
});

export const labelState = {
    ...state,
};

import { type LocalId } from "../../id";
import { buildState } from "../state";

import type { Label } from "./models";

interface ReactiveShapeLabelState {
    id: LocalId;
    labels: Label[];
}

interface ReactiveLabelState {
    activeShape: ReactiveShapeLabelState | undefined;
    shapeLabels: Map<LocalId, Set<string>>;
    labels: Map<string, Label>;
    filterNoLabel: boolean;
    labelFilters: string[];
}

interface LabelState {
    data: Map<LocalId, Label[]>;
}

const state = buildState<ReactiveLabelState, LabelState>(
    {
        activeShape: undefined,
        shapeLabels: new Map(),
        labels: new Map(),
        filterNoLabel: false,
        labelFilters: [],
    },
    { data: new Map() },
);

export const labelState = {
    ...state,
};

import type { ApiLabel } from "../../../apiTypes";
import { type LocalId } from "../../id";
import { buildState } from "../state";

interface ReactiveShapeLabelState {
    id: LocalId;
    labels: ApiLabel[];
}

interface ReactiveLabelState {
    activeShape: ReactiveShapeLabelState | undefined;
    shapeLabels: Map<LocalId, Set<string>>;
    labels: Map<string, ApiLabel>;
    filterNoLabel: boolean;
    labelFilters: string[];
}

interface LabelState {
    data: Map<LocalId, ApiLabel[]>;
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

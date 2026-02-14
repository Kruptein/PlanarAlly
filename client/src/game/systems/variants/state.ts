import { ApiVariant } from "../../../apiTypes";
import { LocalId } from "../../../core/id";
import { buildState } from "../../../core/systems/state";

interface VariantsState {
    data: Map<LocalId, ApiVariant[]>;
}

interface ReactiveVariantsState extends VariantsState {
    leases: Map<LocalId, Set<string>>;
}

const state = buildState<ReactiveVariantsState, VariantsState>(
    {
        data: new Map(),
        leases: new Map(),
    },
    {
        data: new Map(),
    },
);

export const variantsState = {
    ...state,
};

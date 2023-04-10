import type { Operation } from "../../operations/model";

export const enum SelectOperations {
    Noop,
    Resize,
    Drag,
    GroupSelect,
    Rotate,
}

interface SelectState {
    mode: SelectOperations;
    operationReady: boolean;
    operationList: Operation | undefined;
}

export const selectCoreState: SelectState = {
    mode: SelectOperations.Noop,
    operationReady: false,
    operationList: undefined,
};

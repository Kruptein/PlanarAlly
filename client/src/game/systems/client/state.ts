import { reactive, readonly } from "vue";

import type { LocalId } from "../../id";
import type { ServerUserLocationOptions } from "../../models/settings";

interface ClientState {
    playerRectIds: Map<number, LocalId>;
    playerLocationData: Map<number, ServerUserLocationOptions>;
}

const state = reactive<ClientState>({
    playerRectIds: new Map(),
    playerLocationData: new Map(),
});

export const clientState = {
    $: readonly(state),
    _$: state,
};

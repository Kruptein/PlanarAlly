import type { LocalId } from "../../id";
import type { ServerUserLocationOptions } from "../../models/settings";
import { buildState } from "../state";

interface ClientState {
    playerRectIds: Map<number, LocalId>;
    playerLocationData: Map<number, ServerUserLocationOptions>;
}

const state = buildState<ClientState>({
    playerRectIds: new Map(),
    playerLocationData: new Map(),
});

export const clientState = {
    ...state,
};

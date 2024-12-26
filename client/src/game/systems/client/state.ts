import type { Viewport } from "../../../apiTypes";
import type { LocalId } from "../../../core/id";
import { buildState } from "../../../core/systems/state";
import type { PlayerId } from "../players/models";

import type { ClientId } from "./models";

interface ClientState {
    clientIds: Map<ClientId, PlayerId>; // maps client id to player id  <N:1>
    clientViewports: Map<ClientId, Viewport>;
    clientRectIds: Map<ClientId, LocalId>;
}

const state = buildState<ClientState>({
    clientIds: new Map(),
    clientViewports: new Map(),
    clientRectIds: new Map(),
});

export const clientState = {
    ...state,
};

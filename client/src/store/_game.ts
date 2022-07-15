import { reactive, readonly } from "vue";
import type { DeepReadonly } from "vue";

import { toGP } from "../core/geometry";
import type { GlobalPoint } from "../core/geometry";
import type { AssetListMap } from "../core/models/types";
import type { LocalId } from "../game/id";
import type { Label } from "../game/interfaces/label";
import type { Note } from "../game/models/general";
import type { ServerShape } from "../game/models/shapes";

export interface GameState {
    isConnected: boolean;
    isDm: boolean;
    isFakePlayer: boolean;
    showUi: boolean;
    boardInitialized: boolean;

    // Room
    roomName: string;
    roomCreator: string;
    invitationCode: string;
    publicName: string;
    isLocked: boolean;

    assets: AssetListMap;

    markers: Set<LocalId>;

    notes: Note[];

    clipboard: ServerShape[];
    clipboardPosition: GlobalPoint;

    labels: Map<string, Label>;
    filterNoLabel: boolean;
    labelFilters: string[];
}

const data = reactive<GameState>({
    isConnected: false,
    isDm: false,
    isFakePlayer: false,
    showUi: true,
    boardInitialized: false,

    roomName: "",
    roomCreator: "",
    invitationCode: "",
    publicName: window.location.host,
    isLocked: false,

    assets: new Map(),

    markers: new Set(),

    notes: [],

    clipboard: [],
    clipboardPosition: toGP(0, 0),

    labels: new Map(),
    filterNoLabel: false,
    labelFilters: [],
});

export function getGameState(): DeepReadonly<GameState> {
    return readonly(data);
}

export function getRawGameState(): GameState {
    return data;
}

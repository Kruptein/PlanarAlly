import Vue from "vue";
import Vuex from "vuex";

import { AssetState } from "@/assetManager/store";
import { CoreState } from "@/core/store";
import { GameState } from "@/game/store";

import { FloorState } from "./game/layers/store";
import { GameSettingsState } from "./game/settings";
import { ActiveShapeState } from "./game/ui/ActiveShapeStore";
import { InitiativeState } from "./game/ui/initiative/store";
import { VisibilityState } from "./game/visibility/store";

Vue.use(Vuex);

interface RootState {
    activeShape: ActiveShapeState;
    assets: AssetState;
    core: CoreState;
    floor: FloorState;
    game: GameState;
    gameSettings: GameSettingsState;
    initiative: InitiativeState;
    visibility: VisibilityState;
}

export const rootStore = new Vuex.Store<RootState>({});

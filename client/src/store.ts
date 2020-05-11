import { AssetState } from "@/assetManager/store";
import { CoreState } from "@/core/store";
import { GameState } from "@/game/store";
import Vue from "vue";
import Vuex from "vuex";
import { GameSettingsState } from "./game/settings";
import { InitiativeState } from "./game/ui/initiative/store";
import { VisibilityState } from "./game/visibility/store";

Vue.use(Vuex);

export interface RootState {
    assets: AssetState;
    core: CoreState;
    game: GameState;
    gameSettings: GameSettingsState;
    initiative: InitiativeState;
    visibility: VisibilityState;
}

export const rootStore = new Vuex.Store<RootState>({});

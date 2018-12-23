import Vue from "vue";
import Vuex from "vuex";

import { AssetState } from "@/assetManager/store";
import { CoreState } from "@/core/store";
import { GameState } from "@/game/store";

Vue.use(Vuex);

export interface RootState {
    assets: AssetState;
    core: CoreState;
    game: GameState;
}

export const rootStore = new Vuex.Store<RootState>({});

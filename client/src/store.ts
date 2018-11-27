import Vue from "vue";
import Vuex from "vuex";

import { CoreState } from "@/core/store";
import { GameState } from "@/game/store";

Vue.use(Vuex);

export interface RootState {
    core: CoreState;
    game: GameState;
}

export default new Vuex.Store<RootState>({});

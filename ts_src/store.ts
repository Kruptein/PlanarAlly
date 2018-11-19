import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

import coreStore from './core/store';
// import gameStore from './game/store';

export default new Vuex.Store({
    modules: {
        core: coreStore,
        // game: gameStore
    }
})
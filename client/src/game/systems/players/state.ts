import { reactive, readonly } from "vue";

import type { Player } from "../../models/player";

interface PlayerState {
    players: Player[];
}

const state = reactive<PlayerState>({
    players: [],
});

export const playerState = {
    $: readonly(state),
    _$: state,
};

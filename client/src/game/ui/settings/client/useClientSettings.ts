import { computed, type WritableComputedRef } from "vue";

import { playerSettingsSystem } from "../../../systems/settings/players";
import type { PlayerOptions } from "../../../systems/settings/players/models";
import { playerSettingsState } from "../../../systems/settings/players/state";

export function useClientSettings<T extends keyof PlayerOptions>(
    setting: T,
): WritableComputedRef<PlayerOptions[T] | undefined> {
    return computed<PlayerOptions[T] | undefined>({
        get() {
            return playerSettingsState.reactive[setting].value as PlayerOptions[T] | undefined;
        },
        set(value: PlayerOptions[T] | undefined) {
            playerSettingsSystem.getSetter(setting)(value, { sync: true });
        },
    });
}

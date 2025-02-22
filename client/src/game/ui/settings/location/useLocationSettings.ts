import { computed, type Ref, type WritableComputedRef } from "vue";

import { locationSettingsSystem } from "../../../systems/settings/location";
import type { LocationOptions, WithLocationDefault } from "../../../systems/settings/location/models";
import { locationSettingsState } from "../../../systems/settings/location/state";

export function useLocationSettings<T extends keyof LocationOptions>(
    setting: T,
    location: Ref<number | undefined>,
): WritableComputedRef<LocationOptions[T] | undefined> {
    return computed<LocationOptions[T] | undefined>({
        get() {
            return locationSettingsState.getOption(
                locationSettingsState.reactive[setting] as WithLocationDefault<LocationOptions[T]>,
                location.value,
            ).value;
        },
        set(value: LocationOptions[T] | undefined) {
            locationSettingsSystem.getSetter(setting)(value, location.value, true);
        },
    });
}

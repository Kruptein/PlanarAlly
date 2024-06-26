<script setup lang="ts">
import { computed, toRef } from "vue";
import { useI18n } from "vue-i18n";

import { http } from "../../../../core/http";
import { useModal } from "../../../../core/plugins/modals/plugin";
import type { RoomInfo } from "../../../../dashboard/games/types";
import { locationStore } from "../../../../store/location";
import { playerState } from "../../../systems/players/state";
import { uiState } from "../../../systems/ui/state";

const emit = defineEmits(["close"]);

const { t } = useI18n();
const modals = useModal();

const location = toRef(uiState.reactive, "openedLocationSettings");

const hasPlayers = computed(() =>
    [...playerState.reactive.players.values()].some((p) => p.location === location.value),
);

const name = computed({
    get() {
        return locationStore.activeLocations.value.find((l) => l.id === location.value)?.name ?? "";
    },
    set(name: string) {
        locationStore.renameLocation(location.value, name, true);
    },
});

function archiveLocation(): void {
    locationStore.archiveLocation(location.value, true);
    emit("close");
}

async function deleteLocation(): Promise<void> {
    const remove = await modals.confirm(
        t("common.warning"),
        t("game.ui.settings.LocationBar.LocationAdminSettings.remove_location_msg_NAME", {
            name: name.value,
        }),
        {
            yes: t("game.ui.settings.LocationBar.LocationAdminSettings.remove_location_yes"),
            no: t("game.ui.settings.LocationBar.LocationAdminSettings.remove_location_no"),
        },
    );
    if (remove !== true) return;
    locationStore.removeLocation(location.value, true);
    emit("close");
}

async function onCloneClick(): Promise<void> {
    const response = await http.get("/api/rooms");
    if (response.ok) {
        const data = (await response.json()) as { owned: RoomInfo[] };
        const owned = data.owned;

        const choices = await modals.selectionBox(
            t("game.ui.settings.LocationBar.LocationAdminSettings.choose_room"),
            owned.map((room: RoomInfo) => room.name),
        );
        const chosenRoom = owned.find((room) => room.name === choices?.[0]);
        if (!chosenRoom) return;

        const roomName = chosenRoom.name;

        locationStore.cloneLocation(location.value, roomName, true);

        emit("close");
    } else {
        console.log("Recieved a non-ok status code while fetching rooms.");
    }
}
</script>

<template>
    <div class="panel">
        <div class="row">
            <div>
                <label :for="'rename-' + location">{{ t("common.name") }}</label>
            </div>
            <div>
                <input :id="'rename-' + location" v-model="name" type="text" />
            </div>
        </div>
        <div class="row">
            <div>
                <button @click="onCloneClick">
                    {{ t("game.ui.settings.LocationBar.LocationAdminSettings.clone_this_location") }}
                </button>
            </div>
            <div>
                <button
                    class="danger"
                    :disabled="hasPlayers"
                    :title="
                        hasPlayers
                            ? t('game.ui.settings.LocationBar.LocationAdminSettings.move_existing_pl')
                            : t('game.ui.settings.LocationBar.LocationAdminSettings.archive_this_location')
                    "
                    @click="archiveLocation"
                >
                    {{ t("game.ui.settings.LocationBar.LocationAdminSettings.archive_this_location") }}
                </button>
            </div>
            <div>
                <button
                    class="danger"
                    :disabled="hasPlayers"
                    :title="
                        hasPlayers
                            ? t('game.ui.settings.LocationBar.LocationAdminSettings.move_existing_pl')
                            : t('game.ui.settings.LocationBar.LocationAdminSettings.delete_this_location')
                    "
                    @click="deleteLocation"
                >
                    {{ t("game.ui.settings.LocationBar.LocationAdminSettings.delete_this_location") }}
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.danger:hover:disabled {
    cursor: not-allowed;
}
</style>

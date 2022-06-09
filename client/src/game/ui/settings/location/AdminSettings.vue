<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { http } from "../../../../core/http";
import { useModal } from "../../../../core/plugins/modals/plugin";
import type { RoomInfo } from "../../../../dashboard/types";
import { gameStore } from "../../../../store/game";
import { locationStore } from "../../../../store/location";

const emit = defineEmits(["update:location", "close"]);
const props = defineProps<{ location: number }>();

const { t } = useI18n();
const modals = useModal();

const hasPlayers = computed(() => gameStore.state.players.some((p) => p.location === props.location));

const name = computed({
    get() {
        return locationStore.activeLocations.value.find((l) => l.id === props.location)?.name ?? "";
    },
    set(name: string) {
        locationStore.renameLocation(props.location, name, true);
    },
});

function archiveLocation(): void {
    emit("update:location", locationStore.activeLocations.value.find((l) => l.id !== props.location)!.id);
    locationStore.archiveLocation(props.location, true);
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
    emit("update:location", locationStore.activeLocations.value.find((l) => l.id !== props.location)!.id);
    locationStore.removeLocation(props.location, true);
    emit("close");
}

async function onCloneClick(): Promise<void> {
    const response = await http.get("/api/rooms");
    if (response.ok) {
        const data = await response.json();
        var owned: RoomInfo[] = data.owned;

        const choice = await modals.selectionBox(
            t("game.ui.settings.LocationBar.LocationAdminSettings.choose_room"),
            owned.map((room: RoomInfo) => room.name),
        );
        const chosenRoom = owned.find((room) => room.name === choice?.[0]);
        if (!chosenRoom) return;

        const roomName = chosenRoom.name;

        locationStore.cloneLocation(props.location, roomName, true);

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
                <input :id="'rename-' + location" type="text" v-model="name" />
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
                    @click="archiveLocation"
                    :disabled="hasPlayers"
                    :title="
                        hasPlayers
                            ? t('game.ui.settings.LocationBar.LocationAdminSettings.move_existing_pl')
                            : t('game.ui.settings.LocationBar.LocationAdminSettings.archive_this_location')
                    "
                >
                    {{ t("game.ui.settings.LocationBar.LocationAdminSettings.archive_this_location") }}
                </button>
            </div>
            <div>
                <button
                    class="danger"
                    @click="deleteLocation"
                    :disabled="hasPlayers"
                    :title="
                        hasPlayers
                            ? t('game.ui.settings.LocationBar.LocationAdminSettings.move_existing_pl')
                            : t('game.ui.settings.LocationBar.LocationAdminSettings.delete_this_location')
                    "
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

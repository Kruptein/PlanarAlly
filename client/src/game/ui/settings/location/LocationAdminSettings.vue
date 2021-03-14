<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";

import InputCopyElement from "@/core/components/InputCopyElement.vue";
import ConfirmDialog from "@/core/components/modals/ConfirmDialog.vue";
import SelectionBox from "@/core/components/modals/SelectionBox.vue";
import { baseAdjustedFetch } from "@/core/utils";
import { RoomInfo } from "@/dashboard/types";
import { gameStore } from "@/game/store";

import i18n from "../../../../i18n";

@Component({
    components: {
        ConfirmDialog,
        InputCopyElement,
        SelectionBox,
    },
})
export default class LocationAdminSettings extends Vue {
    @Prop() location!: number;

    $refs!: {
        confirm: ConfirmDialog;
        selectionbox: SelectionBox;
    };

    get name(): string {
        return gameStore.activeLocations.find((l) => l.id === this.location)?.name ?? "";
    }

    set name(name: string) {
        gameStore.renameLocation({ location: this.location, name, sync: true });
    }

    get hasPlayers(): boolean {
        return gameStore.players.some((p) => p.location === this.location);
    }

    archiveLocation(): void {
        this.$emit("update:location", gameStore.activeLocations.find((l) => l.id !== this.location)!.id);
        gameStore.archiveLocation({ id: this.location, sync: true });
        this.$emit("close");
    }

    async deleteLocation(): Promise<void> {
        const remove = await this.$refs.confirm.open(
            this.$t("common.warning").toString(),
            this.$t("game.ui.settings.LocationBar.LocationAdminSettings.remove_location_msg_NAME", {
                name: this.name,
            }).toString(),
            {
                yes: this.$t("game.ui.settings.LocationBar.LocationAdminSettings.remove_location_yes").toString(),
                no: this.$t("game.ui.settings.LocationBar.LocationAdminSettings.remove_location_no").toString(),
            },
        );
        if (!remove) return;
        this.$emit("update:location", gameStore.activeLocations.find((l) => l.id !== this.location)!.id);
        gameStore.removeLocation({ id: this.location, sync: true });
        this.$emit("close");
    }

    async onCloneClick(): Promise<void> {
        const response = await baseAdjustedFetch("/api/rooms");
        if (response.ok) {
            const data = await response.json();
            var owned: RoomInfo[] = data.owned;

            const choice = await this.$refs.selectionbox.open(
                i18n.t("game.ui.settings.LocationBar.LocationAdminSettings.choose_room").toString(),
                owned.map((room: RoomInfo) => room.name),
            );
            const chosenRoom = owned.find((room) => room.name === choice);
            if (!chosenRoom) return;

            const roomName = chosenRoom.name;

            gameStore.cloneLocation({
                location: this.location,
                room: roomName,
                sync: true,
            });

            this.$emit("close");
        } else {
            // TODO: Handle error codes. Don't see any type of Notification modal. Should it just console.log?
        }
    }
}
</script>

<template>
    <div class="panel">
        <ConfirmDialog ref="confirm"></ConfirmDialog>
        <SelectionBox ref="selectionbox"></SelectionBox>
        <div class="row">
            <div>
                <label :for="'rename-' + location" v-t="'common.name'"></label>
            </div>
            <div>
                <input :id="'rename-' + location" type="text" v-model="name" />
            </div>
        </div>
        <div class="row">
            <div>
                <button
                    @click="onCloneClick"
                    v-t="'game.ui.settings.LocationBar.LocationAdminSettings.clone_this_location'"
                ></button>
            </div>
            <div>
                <button
                    class="danger"
                    @click="archiveLocation"
                    :disabled="hasPlayers"
                    :title="
                        hasPlayers
                            ? $t('game.ui.settings.LocationBar.LocationAdminSettings.move_existing_pl')
                            : $t('game.ui.settings.LocationBar.LocationAdminSettings.archive_this_location')
                    "
                    v-t="'game.ui.settings.LocationBar.LocationAdminSettings.archive_this_location'"
                ></button>
            </div>
            <div>
                <button
                    class="danger"
                    @click="deleteLocation"
                    :disabled="hasPlayers"
                    :title="
                        hasPlayers
                            ? $t('game.ui.settings.LocationBar.LocationAdminSettings.move_existing_pl')
                            : $t('game.ui.settings.LocationBar.LocationAdminSettings.delete_this_location')
                    "
                    v-t="'game.ui.settings.LocationBar.LocationAdminSettings.delete_this_location'"
                ></button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.danger:hover:disabled {
    cursor: not-allowed;
}
</style>
